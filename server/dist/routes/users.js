"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const prisma_1 = require("../../generated/prisma");
const upload_1 = require("../lib/upload");
const schemas_1 = require("../lib/schemas");
exports.userRouter = (0, express_1.Router)();
const prisma = new prisma_1.PrismaClient();
// register new user
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
        const userExists = await prisma.user.findUnique({
            where: {
                email: validatedData.email,
            },
        });
        if (userExists) {
            res.status(409).send({
                message: "User with this email already exists",
            });
        }
        else {
            const hashedPassword = await bcrypt_1.default.hash(validatedData.password, 12);
            validatedData.password = hashedPassword;
            // const user = new User(validatedData);
            try {
                await prisma.user.create({ data: validatedData });
                res.status(200).send();
            }
            catch (error) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
// get user info
exports.userRouter.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            omit: { password: true },
            where: { id: userId },
            include: {
                friends: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photo: true,
                    },
                },
                receivedFriendRequests: {
                    include: {
                        sentUser: {
                            select: {
                                firstName: true,
                                lastName: true,
                                photo: true,
                            },
                        },
                    },
                },
                sentFriendRequests: {
                    include: {
                        receivedUser: {
                            select: {
                                firstName: true,
                                lastName: true,
                                photo: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).send(user);
    }
    catch (error) {
        res.status(500).send(error);
    }
});
// get user activities
exports.userRouter.get("/:userId/activities", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            const activities = await prisma.activity.findMany({
                where: {
                    userId: userId,
                },
                include: {
                    movie: {
                        select: {
                            title: true,
                            releaseYear: true,
                            poster: true,
                        },
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            photo: true,
                        },
                    },
                    movieReview: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            movie: {
                                select: {
                                    id: true,
                                    title: true,
                                    releaseYear: true,
                                },
                            },
                        },
                    },
                },
            });
            // const activities = await Activity.find({ userId })
            //     .populate("movieId", ["title", "releaseYear", "poster"])
            //     .populate("userId", ["firstName", "lastName", "photo"])
            //     .populate("otherUserId", ["firstName", "lastName"])
            //     .populate({
            //         path: "ratingId",
            //         populate: {
            //             path: "userId",
            //             select: "firstName lastName",
            //         },
            //     })
            //     .populate({
            //         path: "ratingId",
            //         populate: {
            //             path: "movieId",
            //             select: "_id title releaseYear",
            //         },
            //     });
            // res.send({ activities, user });
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
//
exports.userRouter.get("/:userId/friends", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user
            .findUnique({
            where: { id: userId },
            include: {
                friends: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photo: true,
                    },
                },
            },
        });
        if (user) {
            res.status(200).send(user.friends);
        }
        else {
            res.status(500).send({ message: "Cannot find user" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// send a friend request
exports.userRouter.post("/:userId/friend-requests", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
        });
        if (user && otherUser) {
            const friendRequest = await prisma.friendRequest.findUnique({
                where: {
                    sentUserId_receivedUserId: {
                        sentUserId: userId,
                        receivedUserId: otherUserId,
                    },
                },
            });
            if (friendRequest) {
                res.status(409).send({
                    message: "User has already received a friend request",
                });
            }
            else {
                await prisma.friendRequest.create({
                    data: {
                        sentUserId: userId,
                        receivedUserId: otherUserId,
                    },
                });
                res.status(200).send();
            }
        }
        else {
            res.status(500).send({ message: "Cannot find user" });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// accept a friend request
exports.userRouter.post("/:userId/friends", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId } = req.body;
    try {
        // const user = await prisma.user.findUnique({
        //     where: { id: userId },
        //     include: { friends: true },
        // });
        // const otherUser = await prisma.user.findUnique({
        //     where: { id: otherUserId },
        //     include: { friends: true },
        // });
        // if (user && otherUser) {
        const userWithFriend = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                friends: {
                    where: {
                        id: otherUserId,
                    },
                    select: { id: true },
                },
            },
        });
        if (!userWithFriend?.friends.length) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    friends: {
                        connect: {
                            id: otherUserId,
                        },
                    },
                },
            });
            await prisma.user.update({
                where: { id: otherUserId },
                data: {
                    friends: {
                        connect: {
                            id: userId,
                        },
                    },
                },
            });
            await prisma.friendRequest.delete({
                where: {
                    sentUserId_receivedUserId: {
                        sentUserId: otherUserId,
                        receivedUserId: userId,
                    },
                },
            });
            res.status(200).send();
        }
        else
            res.status(409).send({
                message: "The user is already on the friend list",
            });
        // } else {
        //     res.status(500).send({ message: "Cannot find user" });
        // }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
//get user watchlist
exports.userRouter.get("/:userId/watch-list", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                watchList: {
                    include: {
                        movie: {
                            select: {
                                title: true,
                                releaseYear: true,
                                genres: true,
                                avgRating: true,
                                numRatings: true,
                                poster: true,
                            },
                        },
                    },
                },
            },
        });
        if (user) {
            res.send(user.watchList);
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
