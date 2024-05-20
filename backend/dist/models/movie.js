"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Movie = void 0;
const mongoose_1 = require("mongoose");
const movieSchema = new mongoose_1.Schema({
    title: String,
    releaseYear: Number,
    director: String,
    overview: String,
    language: String,
    genres: [String],
    runtime: Number,
    ratings: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "UserRating" }],
    avgRating: Number,
    numRatings: Number,
    poster: String,
    likedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
});
exports.Movie = (0, mongoose_1.model)("Movie", movieSchema);
