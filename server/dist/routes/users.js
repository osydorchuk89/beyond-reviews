"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const upload_1 = require("../lib/upload");
const usersController_1 = require("../controllers/usersController");
exports.usersRouter = (0, express_1.Router)();
// register new user
exports.usersRouter.post("/", upload_1.fileUpload.single("photo"), usersController_1.registerNewUser);
// get user info
exports.usersRouter.get("/:userId", usersController_1.getUserData);
// get user activities
exports.usersRouter.get("/:userId/activities", usersController_1.getUserActivities);
// get user frineds
exports.usersRouter.get("/:userId/friends", usersController_1.getUserFriends);
// send a friend request
exports.usersRouter.post("/:userId/friend-requests", usersController_1.sendFriendRequest);
// accept a friend request
exports.usersRouter.post("/:userId/friends", usersController_1.acceptFriendRequest);
// get user watchlist
exports.usersRouter.get("/:userId/watch-list", usersController_1.getUserWatchlist);
// get user movie reviews
exports.usersRouter.get("/:userId/movie-reviews", usersController_1.getUserMovieReviews);
