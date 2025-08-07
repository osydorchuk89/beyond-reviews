import { Request, Response } from "express";

import { PrismaClient } from "../../generated/prisma";
import { ReviewSchema } from "../lib/schemas";

const prisma = new PrismaClient();

export const getAllMovies = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 15;
        const skip = (page - 1) * limit;

        // get filter, sort, and search parameters
        const genre = req.query.genre as string;
        const releaseYear = req.query.releaseYear as string;
        const director = req.query.director as string;
        const sortBy = (req.query.sortBy as string) || "id";
        const sortOrder = (req.query.sortOrder as string) || "asc";
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

export const getMovieById = async (req: Request, res: Response) => {
    const { movieId } = req.params;
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: movieId,
            },
            include: {
                onWatchList: true,
            },
        });
        res.send(movie);
    } catch (error) {
        res.send(error);
    }
};

export const addOrRemoveMovieFromWatchlist = async (
    req: Request,
    res: Response
) => {
    const { movieId } = req.params;
    const { saved, userId } = req.body;
    try {
        const movie = await prisma.movie.findUnique({ where: { id: movieId } });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (movie && user) {
            if (saved) {
                await prisma.movieWatchList.create({
                    data: {
                        userId: userId,
                        movieId: movieId,
                    },
                });
            } else {
                await prisma.movieWatchList.delete({
                    where: {
                        movieId_userId: {
                            movieId: movieId,
                            userId: userId,
                        },
                    },
                });
            }
            await prisma.activity.create({
                data: {
                    userId: userId,
                    action: saved ? "saved" : "unsaved",
                    movieId: movieId,
                    date: new Date(),
                },
            });
        } else {
            res.status(500).send({
                message: "Could not find movie and/or user",
            });
        }
        res.status(200).send();
    } catch (error) {
        res.send(error);
    }
};

export const getMovieReviews = async (req: Request, res: Response) => {
    const { movieId } = req.params;
    try {
        const movieReviews = await prisma.movieReview.findMany({
            where: { movieId },
            include: {
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
            },
        });
        if (movieReviews) {
            const sortedMovieReviews = movieReviews.sort(
                (a, b) => b.likedBy.length - a.likedBy.length
            );
            res.send(sortedMovieReviews);
        } else {
            res.status(500).send({
                message: "Could not get movie reviews",
            });
        }
    } catch (error) {
        res.send(error);
    }
};

export const createOrUpdateMovieReview = async (
    req: Request,
    res: Response
) => {
    const { rating, text } = req.body;
    const validationResult = ReviewSchema.safeParse({
        rating,
        text,
    });
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    } else {
        try {
            const movieReview = await prisma.movieReview.upsert({
                where: {
                    movieId_userId: {
                        userId: req.body.userId,
                        movieId: req.params.movieId,
                    },
                },
                update: {
                    ...validationResult.data,
                    date: req.body.date,
                },
                create: {
                    ...validationResult.data,
                    userId: req.body.userId,
                    movieId: req.params.movieId,
                    date: req.body.date,
                },
            });
            const movie = await prisma.movie.findUnique({
                where: { id: req.params.movieId },
                include: {
                    reviews: true,
                },
            });
            if (movie) {
                const movieReviews = await prisma.movieReview.findMany({
                    where: {
                        movieId: movie.id,
                    },
                });
                const newAvgRating =
                    movieReviews.reduce((acc, item) => acc + item.rating, 0) /
                    movieReviews.length;
                const newNumRatings = movieReviews.length;
                //updating average rating and number of ratings
                await prisma.movie.update({
                    where: { id: req.params.movieId },
                    data: {
                        avgRating: newAvgRating,
                        numRatings: newNumRatings,
                    },
                });
                // adding user rating to the ratings field of the user object
            } else {
                res.status(500).send({
                    message: "Could not update movie ratings",
                });
            }
            const user = await prisma.user.findUnique({
                where: { id: req.body.userId },
                include: {
                    reviews: true,
                },
            });
            if (user) {
                //adding rating to user ratings array
                if (user.reviews.includes(movieReview)) {
                    const userRatingIndex = user.reviews.indexOf(movieReview);
                    user.reviews.splice(userRatingIndex, 1);
                }
            } else {
                res.status(500).send({
                    message: "Could not find user",
                });
            }
            // creating user activity
            if (user && movie) {
                await prisma.activity.create({
                    data: {
                        userId: user.id,
                        movieId: movie.id,
                        action: "rated",
                        reviewRating: movieReview.rating,
                        reviewText: movieReview.text,
                        date: new Date(),
                    },
                });
            }
            res.status(200).send();
        } catch (error) {
            res.send(error);
        }
    }
};

export const likeOrUnlikeMovieReview = async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId;
    const { like, userId } = req.body;
    try {
        const movieReview = await prisma.movieReview.findUnique({
            where: { id: reviewId },
            include: {
                likedBy: true,
            },
        });
        if (movieReview) {
            if (like) {
                const movieReviewLike = await prisma.movieReviewLike.create({
                    data: {
                        reviewId: movieReview.id,
                        userId: userId,
                    },
                });
                movieReview.likedBy.push(movieReviewLike);
            } else {
                await prisma.movieReviewLike.delete({
                    where: {
                        reviewId_userId: {
                            reviewId: movieReview.id,
                            userId: userId,
                        },
                    },
                });
            }
            await prisma.activity.create({
                data: {
                    userId: userId,
                    movieReviewId: movieReview.id,
                    action: like ? "liked" : "unliked",
                    date: new Date(),
                },
            });
            res.status(200).send();
        } else {
            res.status(500).send({
                message: "Could not find review",
            });
        }
    } catch (error) {
        res.send(error);
    }
};

export const createMovies = async (req: Request, res: Response) => {
    console.log(req.body);
    try {
        await prisma.movie.createMany({
            data: req.body,
        });
    } catch (error) {
        console.log(error);
    }
};
