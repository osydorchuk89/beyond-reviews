"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movieRouter = void 0;
const express_1 = require("express");
const movie_1 = require("../models/movie");
const userRating_1 = require("../models/userRating");
const schemas_1 = require("../util/schemas");
const user_1 = require("../models/user");
exports.movieRouter = (0, express_1.Router)();
exports.movieRouter.get("/", async (req, res) => {
    let movieParams;
    if (req.query.movieIds) {
        const { movieIds } = req.query;
        movieParams = { _id: { $in: movieIds } };
    }
    else {
        movieParams = {};
    }
    try {
        const movies = await movie_1.Movie.find(movieParams);
        res.send(movies);
    }
    catch (error) {
        res.send(error);
    }
});
exports.movieRouter.get("/:movieId", async (req, res) => {
    const { movieId } = req.params;
    try {
        const movie = await movie_1.Movie.findById(movieId).populate({
            path: "ratings",
            populate: "userId",
        });
        res.send(movie);
    }
    catch (error) {
        res.send(error);
    }
});
exports.movieRouter.put("/:movieId", async (req, res) => {
    const { movieId } = req.params;
    const { like, userId } = req.body;
    try {
        const movie = await movie_1.Movie.findById(movieId);
        const user = await user_1.User.findById(userId);
        if (movie && user) {
            if (like) {
                movie.likedBy?.push(userId);
                user.likes?.push(movie._id);
            }
            else {
                movie.likedBy = movie.likedBy.filter((item) => item.toString() !== userId);
                user.likes = user.likes.filter((item) => item.toString() !== movie._id.toString());
            }
            await movie.save();
            await user.save();
        }
        else {
            res.status(500).send({
                message: "Could not find movie and/or user",
            });
        }
        res.status(200).send();
    }
    catch (error) {
        res.send(error);
    }
});
exports.movieRouter.get("/:movieId/ratings", async (req, res) => {
    const { movieId } = req.params;
    try {
        const movieRatings = await userRating_1.UserRating.find({ movieId })
            // .populate("likedBy")
            .populate("userId", ["firstName", "lastName"]);
        const sortedMovieRatings = movieRatings.sort((a, b) => b.likedBy.length - a.likedBy.length);
        res.send(sortedMovieRatings);
    }
    catch (error) {
        res.send(error);
    }
});
exports.movieRouter.post("/:movieId/ratings", async (req, res) => {
    const { movieRating, movieReview } = req.body;
    const validationResult = schemas_1.UserRatingSchema.safeParse({
        movieRating,
        movieReview,
    });
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    }
    else {
        try {
            const userRating = await userRating_1.UserRating.findOneAndUpdate({ userId: req.body.userId, movieId: req.params.movieId }, {
                ...validationResult.data,
                userId: req.body.userId,
                movieId: req.params.movieId,
                date: req.body.date,
            }, { upsert: true, new: true });
            const movie = await movie_1.Movie.findById(req.params.movieId);
            if (movie) {
                //adding rating to movie ratings array
                if (movie.ratings.includes(userRating._id)) {
                    const userRatingIndex = movie.ratings.indexOf(userRating._id);
                    movie.ratings.splice(userRatingIndex, 1);
                }
                movie.ratings.push(userRating._id);
                //adding rating to movie ratings array
                //updating average rating and number of ratings
                const movieRatings = await userRating_1.UserRating.find({
                    _id: {
                        $in: movie.ratings,
                    },
                });
                movie.avgRating =
                    movieRatings.reduce((acc, item) => acc + item.movieRating, 0) / movieRatings.length;
                movie.numRatings = movieRatings.length;
                //updating average rating and number of ratings
                await movie_1.Movie.findByIdAndUpdate(req.params.movieId, movie);
                // adding user rating to the ratings field of the user object
            }
            else {
                res.status(500).send({
                    message: "Could not update movie ratings",
                });
            }
            const user = await user_1.User.findById(req.body.userId);
            if (user) {
                //adding rating to user ratings array
                if (user.ratings?.includes(userRating._id)) {
                    const userRatingIndex = user.ratings.indexOf(userRating._id);
                    user.ratings.splice(userRatingIndex, 1);
                }
                user.ratings?.push(userRating._id);
                //adding rating to user ratings array
                await user.save();
            }
            else {
                res.status(500).send({
                    message: "Could not find user",
                });
            }
            res.status(200).send();
        }
        catch (error) {
            res.send(error);
        }
    }
});
exports.movieRouter.put("/:movieId/ratings/:ratingId", async (req, res) => {
    const ratingId = req.params.ratingId;
    const { like, userId } = req.body;
    try {
        const rating = await userRating_1.UserRating.findById(ratingId);
        if (rating) {
            if (like) {
                rating.likedBy.push(userId);
            }
            else {
                rating.likedBy = rating.likedBy.filter((item) => item.toString() !== userId);
            }
            await rating.save();
            res.status(200).send();
        }
        else {
            res.status(500).send({
                message: "Could not find rating",
            });
        }
    }
    catch (error) {
        res.send(error);
    }
});
exports.movieRouter.post("/", async (req, res) => {
    try {
        await movie_1.Movie.insertMany(req.body);
    }
    catch (error) {
        console.log(error);
    }
});
