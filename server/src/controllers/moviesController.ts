import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import {
    createOrUpdateMovieReviewForUser,
    likeOrUnlikeMovieReviewForUser,
} from "../services/movieReviews";
import { updateMovieWishlist } from "../services/movieWishlist";
import { getErrorMessage, getErrorStatusCode } from "../services/errors";
import {
    fromMovieWriteData,
    toMovieResponse,
    toMovieReviewResponse,
} from "../lib/media";

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
        const actor = req.query.actor as string;
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
        if (actor) {
            whereClause.cast = {
                has: actor,
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
            movies: movies.map(toMovieResponse),
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: page * limit < totalCount,
            appliedFilters: {
                genre,
                releaseYear,
                director,
                actor,
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
                wishlistedByUsers: userId
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

        const { wishlistedByUsers, ...movieData } = movie;
        res.status(200).send({
            ...toMovieResponse(movieData),
            onWishlist: wishlistedByUsers,
        });
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch movie details",
            error,
        });
    }
};

export const addOrRemoveMovieFromWishlist = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { movieId } = req.params;
    const { saved, userId } = req.body;

    try {
        await updateMovieWishlist(prisma, {
            movieId,
            userId,
            saved,
        });
        res.status(200).send();
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not update wishlist"),
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
            prisma.review.findMany({
                where: { movieId },
                include,
                orderBy: {
                    likeCount: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.review.count({
                where: { movieId },
            }),
            userId
                ? prisma.review.findFirst({
                      where: {
                          movieId,
                          userId,
                          mediaType: "MOVIE",
                      },
                      include,
                  })
                : null,
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        res.status(200).send({
            reviews: reviews.map(toMovieReviewResponse),
            totalCount,
            currentPage: page,
            totalPages,
            hasMore,
            userReview: userReview
                ? toMovieReviewResponse(userReview)
                : userReview,
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

        res.status(200).send(toMovieReviewResponse(movieReview));
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
        const movies = Array.isArray(req.body) ? req.body : [req.body];
        const response = await Promise.all(
            movies.map((movie) => {
                const data = fromMovieWriteData(movie);
                return prisma.movie.create({
                    data: {
                        ...(data as any),
                        director:
                            typeof movie.director === "string"
                                ? movie.director
                                : "",
                        runtime:
                            typeof movie.runtime === "number"
                                ? movie.runtime
                                : 0,
                        ...(Array.isArray(movie.cast)
                            ? { cast: movie.cast }
                            : {}),
                        ...(typeof movie.tmdbId === "number"
                            ? { tmdbId: movie.tmdbId }
                            : {}),
                    },
                });
            }),
        );
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
    const updateData = fromMovieWriteData(req.body);

    try {
        const updatedMovie = await prisma.movie.update({
            where: { id: movieId },
            data: updateData as any,
        });
        res.status(200).send(toMovieResponse(updatedMovie));
    } catch (error: any) {
        res.status(500).send({
            message: "Could not update movie",
            error,
        });
    }
};
