"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moviesRouter = void 0;
const express_1 = require("express");
const moviesController_1 = require("../controllers/moviesController");
exports.moviesRouter = (0, express_1.Router)();
// get all movies
exports.moviesRouter.get("/", moviesController_1.getAllMovies);
// get a specific movie
exports.moviesRouter.get("/:movieId", moviesController_1.getMovieById);
// add/remove a movie on/from a watchlist
exports.moviesRouter.put("/:movieId", moviesController_1.addOrRemoveMovieFromWatchlist);
// get reviews of a specific movie
exports.moviesRouter.get("/:movieId/reviews", moviesController_1.getMovieReviews);
// post or update a movie review
exports.moviesRouter.post("/:movieId/reviews", moviesController_1.createOrUpdateMovieReview);
// like or unlike a movie review
exports.moviesRouter.put("/:movieId/reviews/:reviewId", moviesController_1.likeOrUnlikeMovieReview);
// add movies to database for dev purposes
exports.moviesRouter.post("/", moviesController_1.createMovies);
