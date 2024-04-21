import { Router } from "express";
import { Movie } from "../models/movie";
import { UserRating } from "../models/userRating";
import { UserRatingSchema } from "../util/schemas";
import { User } from "../models/user";

export const movieRouter = Router();

movieRouter.get("/", async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.send(movies);
    } catch (error) {
        res.send(error);
    }
});

movieRouter.get("/:movieId", async (req, res) => {
    const { movieId } = req.params;
    try {
        const movie = await Movie.findById(movieId).populate({
            path: "ratings",
            populate: "userId",
        });
        res.send(movie);
    } catch (error) {
        res.send(error);
    }
});

movieRouter.put("/:movieId", async (req, res) => {
    const { movieId } = req.params;
    const { like, userId } = req.body;
    try {
        const movie = await Movie.findById(movieId);
        const user = await User.findById(userId);
        if (movie && user) {
            if (like) {
                movie.likedBy?.push(userId);
                user.likes?.push(movie._id);
            } else {
                movie.likedBy = movie.likedBy!.filter(
                    (item) => item.toString() !== userId
                );
                user.likes = user.likes!.filter(
                    (item) => item.toString() !== movie._id.toString()
                );
            }
            await movie.save();
            await user.save();
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

movieRouter.get("/:movieId/ratings", async (req, res) => {
    const { movieId } = req.params;
    try {
        const movieRatings = await UserRating.find({ movieId })
            // .populate("likedBy")
            .populate("userId", ["firstName", "lastName"]);
        const sortedMovieRatings = movieRatings.sort(
            (a, b) => b.likedBy.length - a.likedBy.length
        );
        res.send(sortedMovieRatings);
    } catch (error) {
        res.send(error);
    }
});

movieRouter.post("/:movieId/ratings", async (req, res) => {
    const { movieRating, movieReview } = req.body;
    const validationResult = UserRatingSchema.safeParse({
        movieRating,
        movieReview,
    });
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    } else {
        try {
            const userRating = await UserRating.findOneAndUpdate(
                { userId: req.body.userId, movieId: req.params.movieId },
                {
                    ...validationResult.data,
                    userId: req.body.userId,
                    movieId: req.params.movieId,
                    date: req.body.date,
                },
                { upsert: true, new: true }
            );
            const movie = await Movie.findById(req.params.movieId);
            if (movie) {
                //adding rating to movie ratings array
                if (movie.ratings.includes(userRating._id)) {
                    const userRatingIndex = movie.ratings.indexOf(
                        userRating._id
                    );
                    movie.ratings.splice(userRatingIndex, 1);
                }
                movie.ratings.push(userRating._id);
                //adding rating to movie ratings array
                //updating average rating and number of ratings
                const movieRatings = await UserRating.find({
                    _id: {
                        $in: movie.ratings,
                    },
                });
                movie.avgRating =
                    movieRatings.reduce(
                        (acc, item) => acc + item.movieRating,
                        0
                    ) / movieRatings.length;
                movie.numRatings = movieRatings.length;
                //updating average rating and number of ratings
                await Movie.findByIdAndUpdate(req.params.movieId, movie);
                // adding user rating to the ratings field of the user object
            } else {
                res.status(500).send({
                    message: "Could not update movie ratings",
                });
            }
            const user = await User.findById(req.body.userId);
            if (user) {
                //adding rating to user ratings array
                if (user.ratings?.includes(userRating._id)) {
                    const userRatingIndex = user.ratings.indexOf(
                        userRating._id
                    );
                    user.ratings.splice(userRatingIndex, 1);
                }
                user.ratings?.push(userRating._id);
                //adding rating to user ratings array
                await user.save();
            } else {
                res.status(500).send({
                    message: "Could not find user",
                });
            }
            res.status(200).send();
        } catch (error) {
            res.send(error);
        }
    }
});

movieRouter.put("/:movieId/ratings/:ratingId", async (req, res) => {
    const ratingId = req.params.ratingId;
    const { like, userId } = req.body;
    try {
        const rating = await UserRating.findById(ratingId);
        if (rating) {
            if (like) {
                rating.likedBy.push(userId);
            } else {
                rating.likedBy = rating.likedBy.filter(
                    (item) => item.toString() !== userId
                );
            }
            await rating.save();
            res.status(200).send();
        } else {
            res.status(500).send({
                message: "Could not find rating",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

movieRouter.post("/", async (req, res) => {
    try {
        await Movie.insertMany(req.body);
    } catch (error) {
        console.log(error);
    }
});
