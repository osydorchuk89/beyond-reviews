import { Router } from "express";

import {
    addOrRemoveMovieFromWatchlist,
    createMovies,
    createOrUpdateMovieReview,
    getAllMovies,
    getMovieById,
    getMovieReviews,
    likeOrUnlikeMovieReview,
    updateMovie,
} from "../controllers/moviesController";

export const moviesRouter = Router();

// get all movies
moviesRouter.get("/", getAllMovies);

// get a specific movie
moviesRouter.get("/:movieId", getMovieById);

// update a movie (for dev purposes - e.g., backfilling data)
moviesRouter.patch("/:movieId", updateMovie);

// add/remove a movie on/from a watchlist
moviesRouter.put("/:movieId", addOrRemoveMovieFromWatchlist);

// get reviews of a specific movie
moviesRouter.get("/:movieId/reviews", getMovieReviews);

// post or update a movie review
moviesRouter.post("/:movieId/reviews", createOrUpdateMovieReview);

// like or unlike a movie review
moviesRouter.put("/:movieId/reviews/:reviewId", likeOrUnlikeMovieReview);

// add movies to database for dev purposes
moviesRouter.post("/", createMovies);
