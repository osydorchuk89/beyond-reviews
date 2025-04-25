import { Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { ReviewSchema } from "../lib/schemas";

export const movieRouter = Router();
const prisma = new PrismaClient();

// get all movies
movieRouter.get("/", async (req, res) => {
    try {
        const movies = await prisma.movie.findMany();
        res.send(movies);
    } catch (error) {
        res.send(error);
    }
});

// get a specific movie
movieRouter.get("/:movieId", async (req, res) => {
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
});

// add/remove a movie on/from a watchlist
movieRouter.put("/:movieId", async (req, res) => {
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
});

// get reviews of a specific movie
movieRouter.get("/:movieId/reviews", async (req, res) => {
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
});

// post or update a movie review
movieRouter.post("/:movieId/reviews", async (req, res) => {
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
                //adding rating to movie ratings array
                // if (movie.reviews.includes(movieReview)) {
                //     const movieReviewIndex = movie.reviews.indexOf(movieReview);
                //     movie.reviews.splice(movieReviewIndex, 1);
                // }
                // movie.reviews.push(movieReview);
                //adding rating to movie ratings array
                //updating average rating and number of ratings

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
                // user.reviews.push(movieReview);
                //adding rating to user ratings array
                // await user.save();
            } else {
                res.status(500).send({
                    message: "Could not find user",
                });
            }
            // creating user action
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
});

// like or unlike a movie review
movieRouter.put("/:movieId/reviews/:reviewId", async (req, res) => {
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
});

movieRouter.post("/", async (req, res) => {
    try {
        await prisma.movie.createMany({
            data: req.body,
        });
    } catch (error) {
        console.log(error);
    }
});
