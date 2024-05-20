"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRating = void 0;
const mongoose_1 = require("mongoose");
const userRatingSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    movieId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Movie" },
    movieRating: Number,
    movieReview: String,
    date: Date,
    likedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
});
exports.UserRating = (0, mongoose_1.model)("UserRating", userRatingSchema);
