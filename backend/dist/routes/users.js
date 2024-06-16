"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const user_1 = require("../models/user");
const activity_1 = require("../models/activity");
const schemas_1 = require("../util/schemas");
const upload_1 = require("../upload");
const userRating_1 = require("../models/userRating");
const movie_1 = require("../models/movie");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get("/", async (req, res) => {
    const users = await user_1.User.find();
    res.send(users);
});
exports.userRouter.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await user_1.User.findById(userId);
        // .populate("likes", [
        //     "title",
        //     "releaseYear",
        //     "poster",
        // ]);
        res.send(user);
    }
    catch (error) {
        res.send(error);
    }
});
exports.userRouter.get("/:userId/ratings", async (req, res) => {
    const { userId } = req.params;
    try {
        const userRatings = await userRating_1.UserRating.find({ userId }).populate("movieId", ["title", "releaseYear", "poster"]);
        res.send(userRatings);
    }
    catch (error) {
        res.send(error);
    }
});
exports.userRouter.get("/:userId/watchList", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await user_1.User.findById(userId);
        if (user) {
            const movieIds = user.watchList;
            const movieParams = { _id: { $in: movieIds } };
            const savedMovies = await movie_1.Movie.find(movieParams);
            res.send(savedMovies);
        }
        else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    }
    catch (error) {
        res.send(error);
    }
});
exports.userRouter.get("/:userId/activity", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await user_1.User.findById(userId);
        if (user) {
            const activities = await activity_1.Activity.find({ userId })
                .populate("movieId", ["title", "releaseYear", "poster"])
                .populate("userId", ["firstName", "lastName"])
                .populate("otherUserId", ["firstName", "lastName"])
                .populate({
                path: "ratingId",
                populate: {
                    path: "userId",
                    select: "firstName lastName",
                },
            })
                .populate({
                path: "ratingId",
                populate: {
                    path: "movieId",
                    select: "_id title releaseYear",
                },
            });
            res.send(activities);
        }
        else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    }
    catch (error) {
        res.send(error);
    }
});
exports.userRouter.post("/", upload_1.fileUpload.single("photo"), async (req, res) => {
    const userData = req.body;
    if (req.file) {
        const userPhotoFile = req.file;
        userData.photo = userPhotoFile.location;
    }
    else {
        userData.photo =
            "https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png";
    }
    const validationResult = schemas_1.UserSchema.safeParse(userData);
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    }
    else {
        const validatedData = validationResult.data;
        const userExists = await user_1.User.findOne({
            email: validatedData.email,
        });
        if (userExists) {
            res.status(409).send({
                message: "User with this email already exists",
            });
        }
        else {
            const hashedPassword = await bcrypt_1.default.hash(validatedData.password, 12);
            validatedData.password = hashedPassword;
            const user = new user_1.User(validatedData);
            try {
                await user.save();
                res.status(200).send();
            }
            catch (error) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
