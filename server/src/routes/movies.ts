import { Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { ReviewSchema } from "../lib/schemas";

export const movieRouter = Router();
const prisma = new PrismaClient();

movieRouter.get("/", async (req, res) => {
    try {
        const movies = await prisma.movie.findMany();
        res.send(movies);
    } catch (error) {
        res.send(error);
    }
});

movieRouter.get("/:movieId", async (req, res) => {
    const { movieId } = req.params;
    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id: movieId,
            },
        });
        res.send(movie);
    } catch (error) {
        res.send(error);
    }
});

// movieRouter.put("/:movieId", async (req, res) => {
//     const { movieId } = req.params;
//     const { saved, userId } = req.body;
//     try {
//         const movie = await Movie.findById(movieId);
//         const user = await User.findById(userId);
//         if (movie && user) {
//             if (saved) {
//                 movie.onWatchList?.push(userId);
//                 user.watchList?.push(movie._id);
//             } else {
//                 movie.onWatchList = movie.onWatchList!.filter(
//                     (item) => item.toString() !== userId
//                 );
//                 user.watchList = user.watchList!.filter(
//                     (item) => item.toString() !== movie._id.toString()
//                 );
//             }
//             const userActivityParams = {
//                 userId,
//                 movieId,
//                 action: saved ? "saved" : "unsaved",
//                 date: new Date(),
//             };
//             const userActivity = new Activity(userActivityParams);
//             await movie.save();
//             await user.save();
//             await userActivity.save();
//         } else {
//             res.status(500).send({
//                 message: "Could not find movie and/or user",
//             });
//         }
//         res.status(200).send();
//     } catch (error) {
//         res.send(error);
//     }
// });

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
            // const sortedMovieReviews = movieReviews.sort(
            //     (a, b) => b.likedBy.length - a.likedBy.length
            // );
            // res.send(sortedMovieReviews);
            res.send(movieReviews);
        } else {
            res.status(500).send({
                message: "Could not get movie reviews",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

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
            const userReview = await prisma.movieReview.upsert({
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
                if (movie.reviews.includes(userReview)) {
                    const userReviewIndex = movie.reviews.indexOf(userReview);
                    movie.reviews.splice(userReviewIndex, 1);
                }
                movie.reviews.push(userReview);
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
                if (user.reviews.includes(userReview)) {
                    const userRatingIndex = user.reviews.indexOf(userReview);
                    user.reviews.splice(userRatingIndex, 1);
                }
                user.reviews.push(userReview);
                //adding rating to user ratings array
                // await user.save();
            } else {
                res.status(500).send({
                    message: "Could not find user",
                });
            }
            // adding user action to the respective collection
            // if (user && movie) {
            //     const userActivityParams = {
            //         userId: user._id,
            //         movieId: movie._id,
            //         action: "rated",
            //         rating: movieRating,
            //         review: movieReview,
            //         date: new Date(),
            //     };
            //     const userActivity = new Activity(userActivityParams);
            //     await userActivity.save();
            // }
            res.status(200).send();
        } catch (error) {
            res.send(error);
        }
    }
});

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
            // const userActivityParams = {
            //     userId,
            //     ratingId: rating._id,
            //     action: like ? "liked" : "unliked",
            //     date: new Date(),
            // };
            // const userActivity = new Activity(userActivityParams);
            // await userActivity.save();
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
