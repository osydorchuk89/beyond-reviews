import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import {
    createOrUpdateMovieReviewForUser,
    likeOrUnlikeMovieReviewForUser,
} from "../services/movieReviews";
import { updateMovieWatchlist } from "../services/movieWatchlist";
import { getErrorMessage, getErrorStatusCode } from "../services/errors";

const prisma = new PrismaClient();

export const getAllMovies = async (
    req: Request,
    res: Response,
): Promise<any> => {
    try {
        const page = parseInt(req.query.page as string) ?? 1;
        const limit = parseInt(req.query.limit as string) ?? 15;
        const skip = (page - 1) * limit;

        // get filter, sort, and search parameters
        const genre = req.query.genre as string;
        const releaseYear = req.query.releaseYear as string;
        const director = req.query.director as string;
        const sortBy = (req.query.sortBy as string) ?? "id";
        const sortOrder = (req.query.sortOrder as string) ?? "asc";
        const search = req.query.search as string;

        const whereClause: any = {};
        if (genre) {
            whereClause.genres = {
                has: genre,
            };
        }
        if (releaseYear) {
            whereClause.releaseYear = parseInt(releaseYear);
        }
        if (director) {
            whereClause.director = {
                contains: director,
                mode: "insensitive",
            };
        }
        if (search) {
            whereClause.title = {
                contains: search,
                mode: "insensitive",
            };
        }

        const orderByClause: any = {};
        switch (sortBy) {
            case "numRatings":
                orderByClause.numRatings = sortOrder;
                break;
            case "releaseYear":
                orderByClause.releaseYear = sortOrder;
                break;
            case "avgRating":
                orderByClause.avgRating = sortOrder;
                break;
            case "id":
                orderByClause.id = sortOrder;
                break;
            default:
                orderByClause.id = "asc";
        }

        const [movies, totalCount] = await Promise.all([
            prisma.movie.findMany({
                where: whereClause,
                orderBy: orderByClause,
                skip,
                take: limit,
            }),
            prisma.movie.count({ where: whereClause }),
        ]);

        res.status(200).send({
            movies,
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: page * limit < totalCount,
            appliedFilters: {
                genre,
                releaseYear,
                director,
                sortBy,
                sortOrder,
                search,
            },
        });
    } catch (error) {
        res.status(500).send({ message: "Could not fetch movies", error });
    }
};

export const getMovieById = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { movieId } = req.params;
    const userId =
        ((req.user as { id?: string } | undefined)?.id ??
            req.query.userId) as string | undefined;
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: movieId,
            },
            include: {
                onWatchList: userId
                    ? {
                          where: {
                              userId,
                          },
                          select: {
                              userId: true,
                          },
                      }
                    : false,
            },
        });

        if (!movie) {
            return res.status(404).send({ message: "Movie not found" });
        }

        res.status(200).send(movie);
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch movie details",
            error,
        });
    }
};

export const addOrRemoveMovieFromWatchlist = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { movieId } = req.params;
    const { saved, userId } = req.body;

    try {
        await updateMovieWatchlist(prisma, {
            movieId,
            userId,
            saved,
        });
        res.status(200).send();
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not update watchlist"),
            error,
        });
    }
};

export const getMovieReviews = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { movieId } = req.params;
    const page = parseInt(req.query.page as string) ?? 1;
    const limit = parseInt(req.query.limit as string) ?? 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId as string | undefined;

    try {
        const include = {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
            likedBy: {
                select: {
                    userId: true,
                },
            },
        };

        const [reviews, totalCount, userReview] = await Promise.all([
            prisma.movieReview.findMany({
                where: { movieId },
                include,
                orderBy: {
                    likeCount: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.movieReview.count({
                where: { movieId },
            }),
            userId
                ? prisma.movieReview.findUnique({
                      where: {
                          movieId_userId: {
                              movieId,
                              userId,
                          },
                      },
                      include,
                  })
                : null,
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        res.status(200).send({
            reviews,
            totalCount,
            currentPage: page,
            totalPages,
            hasMore,
            userReview,
        });
    } catch (error) {
        res.status(500).send({ message: "Could not get movie reviews", error });
    }
};

export const createOrUpdateMovieReview = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { rating, text } = req.body;

    try {
        const movieReview = await createOrUpdateMovieReviewForUser(prisma, {
            movieId: req.params.movieId,
            userId: req.body.userId,
            rating,
            text,
            date: req.body.date,
        });

        res.status(200).send(movieReview);
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not create or update review"),
            error,
        });
    }
};

export const likeOrUnlikeMovieReview = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const reviewId = req.params.reviewId;
    const { like, userId } = req.body;
    try {
        await likeOrUnlikeMovieReviewForUser(prisma, {
            reviewId,
            userId,
            like,
        });
        res.status(200).send();
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not like or unlike review"),
            error,
        });
    }
};

// For dev purposes only
export const createMovies = async (
    req: Request,
    res: Response,
): Promise<any> => {
    try {
        const response = await prisma.movie.createMany({
            data: req.body,
        });
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: "Could not create movie",
            error,
        });
    }
};

// For dev purposes only
export const updateMovie = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { movieId } = req.params;
    const updateData = req.body;

    try {
        const updatedMovie = await prisma.movie.update({
            where: { id: movieId },
            data: updateData,
        });
        res.status(200).send(updatedMovie);
    } catch (error: any) {
        res.status(500).send({
            message: "Could not update movie",
            error,
        });
    }
};
