"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    photo: String,
    password: String,
    googleId: String,
    ratings: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "UserRating" }],
    watchList: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Movie" }],
    receivedFriendRequests: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    sentFriendRequests: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
    sentMessages: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Message" }],
    receivedMessages: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Message" }],
});
exports.User = (0, mongoose_1.model)("User", userSchema);
