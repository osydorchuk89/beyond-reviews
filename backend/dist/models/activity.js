"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
const mongoose_1 = require("mongoose");
const activitySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    movieId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Movie" },
    ratingId: { type: mongoose_1.Schema.Types.ObjectId, ref: "UserRating" },
    otherUserId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    action: String,
    rating: Number,
    review: String,
    date: Date,
});
exports.Activity = (0, mongoose_1.model)("Activity", activitySchema);
