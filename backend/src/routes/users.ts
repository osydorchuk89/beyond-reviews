import bcrypt from "bcrypt";
import { Router } from "express";
import { User } from "../models/user";
import { Activity } from "../models/activity";
import { UserSchema } from "../util/schemas";
import { fileUpload } from "../upload";
import { UserRating } from "../models/userRating";
import { Movie } from "../models/movie";

export const userRouter = Router();

userRouter.get("/", async (req, res) => {
    const users = await User.find();
    res.send(users);
});

userRouter.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId)
            .populate("friends", ["_id", "firstName", "lastName", "photo"])
            .populate("receivedFriendRequests", [
                "_id",
                "firstName",
                "lastName",
                "photo",
            ])
            .populate("sentFriendRequests", [
                "_id",
                "firstName",
                "lastName",
                "photo",
            ]);
        res.send(user);
    } catch (error) {
        res.send(error);
    }
});

userRouter.get("/:userId/ratings", async (req, res) => {
    const { userId } = req.params;
    try {
        const userRatings = await UserRating.find({ userId }).populate(
            "movieId",
            ["title", "releaseYear", "poster"]
        );
        res.send(userRatings);
    } catch (error) {
        res.send(error);
    }
});

userRouter.get("/:userId/watchList", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (user) {
            const movieIds = user.watchList;
            const movieParams = { _id: { $in: movieIds } };
            const savedMovies = await Movie.find(movieParams);
            res.send(savedMovies);
        } else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

userRouter.get("/:userId/activity", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (user) {
            const activities = await Activity.find({ userId })
                .populate("movieId", ["title", "releaseYear", "poster"])
                .populate("userId", ["firstName", "lastName", "photo"])
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
            res.send({ activities, user });
        } else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

userRouter.post("/:userId/friend-requests", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId }: { otherUserId: string } = req.body;
    try {
        const user = await User.findById(userId);
        const otherUser = await User.findById(otherUserId);
        if (user && otherUser) {
            if (!user.receivedFriendRequests.includes(otherUser._id)) {
                otherUser.sentFriendRequests.push(user._id);
                user.receivedFriendRequests.push(otherUser._id);
                await user.save();
                await otherUser.save();
                res.status(200).send();
            } else
                res.status(409).send({
                    message: "User has already received a friend rreuest",
                });
        } else {
            res.status(500).send({ message: "Cannot find user" });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

userRouter.post("/:userId/friends", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId } = req.body;
    try {
        const user = await User.findById(userId);
        const otherUser = await User.findById(otherUserId);
        if (user && otherUser) {
            if (!user.friends.includes(otherUser._id)) {
                const updatedUserReceivedFriendRequests =
                    user.receivedFriendRequests.filter(
                        (requestUser) =>
                            requestUser.toString() !== otherUser._id.toString()
                    );
                const updatedUserSentFriendRequests =
                    otherUser.sentFriendRequests.filter(
                        (requestUser) =>
                            requestUser.toString() !== user._id.toString()
                    );
                user.receivedFriendRequests = updatedUserReceivedFriendRequests;
                otherUser.sentFriendRequests = updatedUserSentFriendRequests;
                user.friends.push(otherUser._id);
                otherUser.friends.push(user._id);
                await user.save();
                await otherUser.save();
                res.status(200).send();
            } else
                res.status(409).send({
                    message: "The user is already on the friend list",
                });
        } else {
            res.status(500).send({ message: "Cannot find user" });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

userRouter.get("/:userId/friends", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).populate("friends", [
            "_id",
            "firstName",
            "lastName",
            "photo",
        ]);
        if (user) {
            // const friendIds = user.friends;
            // console.log(friendIds);
            console.log(user.friends);
            return user.friends;
        } else {
            res.status(500).send({ message: "Cannot find user" });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

userRouter.post("/", fileUpload.single("photo"), async (req, res) => {
    const userData = req.body;
    if (req.file) {
        const userPhotoFile: { [key: string]: any } = req.file;
        userData.photo = userPhotoFile.location;
    } else {
        userData.photo =
            "https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png";
    }
    const validationResult = UserSchema.safeParse(userData);
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    } else {
        const validatedData = validationResult.data;
        const userExists = await User.findOne({
            email: validatedData.email,
        });
        if (userExists) {
            res.status(409).send({
                message: "User with this email already exists",
            });
        } else {
            const hashedPassword = await bcrypt.hash(
                validatedData.password,
                12
            );
            validatedData.password = hashedPassword;
            const user = new User(validatedData);
            try {
                await user.save();
                res.status(200).send();
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
