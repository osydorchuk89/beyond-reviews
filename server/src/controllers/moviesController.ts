import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import { ReviewSchema } from "../lib/schemas";

const prisma = new PrismaClient();

export const getAllMovies = async (req: Request, res: Response) => {
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
        res.status(500).send({
            message: "Could not fetch movie details",
            error,
        });
    }
};

export const addOrRemoveMovieFromWatchlist = async (
    req: Request,
    res: Response
) => {
    const { movieId } = req.params;
    const { saved, userId } = req.body;
    try {
        await prisma.$transaction(async (tx) => {
            if (saved) {
                await tx.movieWatchList.create({
                    data: {
                        userId: userId,
                        movieId: movieId,
                    },
                });
            } else {
                await tx.movieWatchList.delete({
                    where: {
                        movieId_userId: {
                            movieId: movieId,
                            userId: userId,
                        },
                    },
                });
            }
            await tx.activity.create({
                data: {
                    userId: userId,
                    action: saved ? "saved" : "unsaved",
                    movieId: movieId,
                    date: new Date(),
                },
            });
        });
        res.status(200).send();
    } catch (error) {
        res.status(500).send({ message: "Could not update watchlist", error });
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
            orderBy: {
                likedBy: {
                    _count: "desc",
                },
            },
        });
        res.send(movieReviews);
    } catch (error) {
        res.status(500).send({ message: "Could not get movie reviews", error });
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
            const movieReview = await prisma.$transaction(async (tx) => {
                const review = await tx.movieReview.upsert({
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

                // Use aggregation to calculate average rating and count
                const aggregations = await tx.movieReview.aggregate({
                    where: {
                        movieId: req.params.movieId,
                    },
                    _avg: {
                        rating: true,
                    },
                    _count: {
                        rating: true,
                    },
                });

                // Update movie with new stats
                await tx.movie.update({
                    where: { id: req.params.movieId },
                    data: {
                        avgRating: aggregations._avg.rating ?? 0,
                        numRatings: aggregations._count.rating,
                    },
                });

                // Create user activity
                await tx.activity.create({
                    data: {
                        userId: req.body.userId,
                        movieId: req.params.movieId,
                        action: "rated",
                        reviewRating: review.rating,
                        reviewText: review.text,
                        date: new Date(),
                    },
                });

                return review;
            });

            res.status(200).send(movieReview);
        } catch (error) {
            res.status(500).send({
                message: "Could not create or update review",
                error,
            });
        }
    }
};

export const likeOrUnlikeMovieReview = async (req: Request, res: Response) => {
    const reviewId = req.params.reviewId;
    const { like, userId } = req.body;
    try {
        const movieReview = await prisma.movieReview.findUnique({
            where: { id: reviewId },
        });
        if (movieReview) {
            await prisma.$transaction(async (tx) => {
                if (like) {
                    await tx.movieReviewLike.create({
                        data: {
                            reviewId: movieReview.id,
                            userId: userId,
                        },
                    });
                } else {
                    await tx.movieReviewLike.delete({
                        where: {
                            reviewId_userId: {
                                reviewId: movieReview.id,
                                userId: userId,
                            },
                        },
                    });
                }
                await tx.activity.create({
                    data: {
                        userId: userId,
                        movieReviewId: movieReview.id,
                        action: like ? "liked" : "unliked",
                        date: new Date(),
                    },
                });
            });
            res.status(200).send();
        } else {
            res.status(500).send({
                message: "Could not find review",
            });
        }
    } catch (error) {
        res.status(500).send({
            message: "Could not like or unlike review",
            error,
        });
    }
};

export const createMovies = async (req: Request, res: Response) => {
    try {
        const response = await prisma.movie.createMany({
            data: req.body,
        });
        res.send(response);
    } catch (error) {
        console.log(error);
    }
};
