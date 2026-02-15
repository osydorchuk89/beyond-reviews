import { Router } from "express";

import { fileUpload } from "../lib/upload";
import {
    acceptFriendRequest,
    getAllUsers,
    getUserActivities,
    getUserData,
    getUserFriends,
    getUserMovieReviews,
    getUserWatchlist,
    registerNewUser,
    seedUsers,
    sendFriendRequest,
} from "../controllers/usersController";

export const usersRouter = Router();

// get all users (for dev purposes)
usersRouter.get("/", getAllUsers);

// register new user
usersRouter.post("/", fileUpload.single("photo"), registerNewUser);

// get user info
usersRouter.get("/:userId", getUserData);

// get user activities
usersRouter.get("/:userId/activities", getUserActivities);

// get user frineds
usersRouter.get("/:userId/friends", getUserFriends);

// send a friend request
usersRouter.post("/:userId/friend-requests", sendFriendRequest);

// accept a friend request
usersRouter.post("/:userId/friends", acceptFriendRequest);

// get user watchlist
usersRouter.get("/:userId/watch-list", getUserWatchlist);

// get user movie reviews
usersRouter.get("/:userId/movie-reviews", getUserMovieReviews);

// create new users in bulk - for dev purposes
usersRouter.post("/seed", seedUsers);
