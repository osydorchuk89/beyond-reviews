import { Router } from "express";

import { fileUpload, uploadPhotoToGcs } from "../lib/upload";
import {
    acceptFriendRequest,
    getAllUsers,
    getUserActivities,
    getUserData,
    getUserFriendRecommendations,
    getUserFriends,
    getUserMovieRecommendations,
    getUserMovieReviews,
    getUserBookReviews,
    getUserBookWishlist,
    getUserWishlist,
    registerNewUser,
    seedUsers,
    sendFriendRequest,
} from "../controllers/usersController";

export const usersRouter = Router();

// get all users (for dev purposes)
usersRouter.get("/", getAllUsers);

// register new user
usersRouter.post(
    "/",
    fileUpload.single("photo"),
    uploadPhotoToGcs,
    registerNewUser,
);

// get user info
usersRouter.get("/:userId", getUserData);

// get user activities
usersRouter.get("/:userId/activities", getUserActivities);

// get user frineds
usersRouter.get("/:userId/friends", getUserFriends);

// get user friend recommendations
usersRouter.get(
    "/:userId/recommendations/friends",
    getUserFriendRecommendations,
);

// get user movie recommendations
usersRouter.get(
    "/:userId/recommendations/movies",
    getUserMovieRecommendations,
);

// send a friend request
usersRouter.post("/:userId/friend-requests", sendFriendRequest);

// accept a friend request
usersRouter.post("/:userId/friends", acceptFriendRequest);

// get user wishlist
usersRouter.get("/:userId/wishlist", getUserWishlist);

// get user wishlist (legacy watchlist route)
usersRouter.get("/:userId/watch-list", getUserWishlist);

// get user book wishlist
usersRouter.get("/:userId/books/wishlist", getUserBookWishlist);

// get user book wishlist (legacy watchlist route)
usersRouter.get("/:userId/books/watch-list", getUserBookWishlist);

// get user movie reviews
usersRouter.get("/:userId/movie-reviews", getUserMovieReviews);

// get user book reviews
usersRouter.get("/:userId/book-reviews", getUserBookReviews);

// create new users in bulk - for dev purposes
usersRouter.post("/seed", seedUsers);
