import { Router } from "express";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../../generated/prisma";
import { fileUpload } from "../lib/upload";
import { UserSchema } from "../lib/schemas";

export const userRouter = Router();
const prisma = new PrismaClient();

// register new user
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
        const userExists = await prisma.user.findUnique({
            where: {
                email: validatedData.email,
            },
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
            // const user = new User(validatedData);
            try {
                await prisma.user.create({ data: validatedData });
                res.status(200).send();
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});

// get user info
userRouter.get("/:userId", async (req, res) => {
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
    } catch (error) {
        res.status(500).send(error);
    }
});

// get user activities
userRouter.get("/:userId/activities", async (req, res) => {
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
            res.send(activities);
        } else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

//
userRouter.get("/:userId/friends", async (req, res) => {
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
            })
        if (user) {
            res.status(200).send(user.friends);
        } else {
            res.status(500).send({ message: "Cannot find user" });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

// send a friend request
userRouter.post("/:userId/friend-requests", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId }: { otherUserId: string } = req.body;
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
            } else {
                await prisma.friendRequest.create({
                    data: {
                        sentUserId: userId,
                        receivedUserId: otherUserId,
                    },
                });
                res.status(200).send();
            }
        } else {
            res.status(500).send({ message: "Cannot find user" });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

// accept a friend request
userRouter.post("/:userId/friends", async (req, res) => {
    const { userId } = req.params;
    const { otherUserId } = req.body;
    try {
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
        } else
            res.status(409).send({
                message: "The user is already on the friend list",
            });
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

//get user watchlist
userRouter.get("/:userId/watch-list", async (req, res) => {
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
        } else {
            res.status(500).send({
                message: "Could not find user",
            });
        }
    } catch (error) {
        res.send(error);
    }
});
