import { Router } from "express";
import { Movie } from "../models/movie";
import { UserRating } from "../models/userRating";
import { UserRatingSchema } from "../util/schemas";
import { isLoggedIn } from "../app";

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
    const movieId = req.params.movieId;
    try {
        const movie = await Movie.findById(movieId).populate("ratings");
        res.send(movie);
    } catch (error) {
        res.send(error);
    }
});

movieRouter.get("/:movieId/ratings", async (req, res) => {
    const { userId } = req.query;
    const { movieId } = req.params;
    try {
        if (userId) {
            const userRating = await UserRating.findOne({ userId, movieId });
            res.send(userRating);
        } else {
            const userRating = await UserRating.find({ movieId });
            res.send(userRating);
        }
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
                },
                { upsert: true, new: true }
            );
            const movie = await Movie.findById(req.params.movieId);
            if (movie) {
                //adding rating to ratings array
                if (movie.ratings.includes(userRating._id)) {
                    const userRatingIndex = movie.ratings.indexOf(
                        userRating._id
                    );
                    movie.ratings.splice(userRatingIndex, 1);
                }
                movie.ratings.push(userRating._id);
                //adding rating to ratings array
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
                res.status(200).send();
            } else {
                res.status(500).send({
                    message: "Could not update movie ratings",
                });
            }
        } catch (error) {
            res.send(error);
        }
    }
});

movieRouter.post("/", async (req, res) => {
    try {
        await Movie.insertMany(req.body);
    } catch (error) {
        console.log(error);
    }
});
