import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { UserSchema } from "../lib/schemas";
import { login } from "./authController";

const prisma = new PrismaClient();

export const registerNewUser = async (
    req: Request,
    res: Response,
): Promise<any> => {
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
        res.status(400).send({ message: "Validation failed" });
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
                12,
            );
            validatedData.password = hashedPassword;
            try {
                const newUser = await prisma.user.create({
                    data: validatedData,
                    omit: { password: true },
                });

                req.login(newUser, (err) => {
                    if (err) {
                        console.error(
                            "Auto-login error after registration:",
                            err,
                        );
                        return res.status(201).send({
                            message:
                                "User created successfully, please login manually",
                        });
                    }

                    login(req, res);
                });
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
};

export const getUserData = async (
    req: Request,
    res: Response,
): Promise<any> => {
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

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send(user);
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch user data",
        });
    }
};

export const getUserActivities = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) ?? 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    try {
        const [activities, totalCount] = await Promise.all([
            prisma.activity.findMany({
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
                orderBy: { date: "desc" },
                skip: skip,
                take: limit,
            }),
            prisma.activity.count({
                where: { userId: userId },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        res.status(200).send({
            activities,
            totalCount,
            currentPage: page,
            totalPages,
            hasMore,
        });
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch user activities",
            error,
        });
    }
};

export const getUserFriends = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
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
        res.status(200).send(user?.friends ?? []);
    } catch (error: any) {
        res.status(500).send({
            message: "Could not fetch user friends",
            error,
        });
    }
};

export const sendFriendRequest = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    const { otherUserId }: { otherUserId: string } = req.body;

    const sender = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!sender) {
        return res.status(404).send({ message: "Sender user not found" });
    }

    const recipient = await prisma.user.findUnique({
        where: { id: otherUserId },
    });

    if (!recipient) {
        return res.status(404).send({ message: "Recipient user not found" });
    }

    try {
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
    } catch (error: any) {
        res.status(500).send({
            message: "Could not send friend request",
            error,
        });
    }
};

export const acceptFriendRequest = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    const { otherUserId } = req.body;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return res.status(404).send({ message: "User not found" });
    }

    const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
    });

    if (!otherUser) {
        return res.status(404).send({ message: "Other user not found" });
    }

    try {
        // Check if friend request exists
        const friendRequest = await prisma.friendRequest.findUnique({
            where: {
                sentUserId_receivedUserId: {
                    sentUserId: otherUserId,
                    receivedUserId: userId,
                },
            },
        });

        if (!friendRequest) {
            return res
                .status(404)
                .send({ message: "Friend request not found" });
        }

        // Check if already friends
        const existingFriendship = await prisma.user.findFirst({
            where: {
                id: userId,
                friends: {
                    some: {
                        id: otherUserId,
                    },
                },
            },
        });

        if (existingFriendship) {
            res.status(409).send({
                message: "The user is already on the friend list",
            });
            return;
        }

        // Execute all operations atomically
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    friends: {
                        connect: {
                            id: otherUserId,
                        },
                    },
                },
            });
            await tx.user.update({
                where: { id: otherUserId },
                data: {
                    friends: {
                        connect: {
                            id: userId,
                        },
                    },
                },
            });
            await tx.friendRequest.delete({
                where: {
                    sentUserId_receivedUserId: {
                        sentUserId: otherUserId,
                        receivedUserId: userId,
                    },
                },
            });
        });

        res.status(200).send();
    } catch (error: any) {
        res.status(500).send({
            message: "Could not accept friend request",
            error,
        });
    }
};

export const getUserWatchlist = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    try {
        const watchlist = await prisma.movieWatchList.findMany({
            where: { userId },
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
        });
        res.status(200).send(watchlist);
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch user watchlist",
            error,
        });
    }
};

export const getUserMovieReviews = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;
    try {
        const reviews = await prisma.movieReview.findMany({
            where: { userId },
            include: {
                movie: {
                    select: {
                        id: true,
                        title: true,
                        releaseYear: true,
                        poster: true,
                    },
                },
            },
            orderBy: { date: "desc" },
        });
        res.status(200).send(reviews);
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch user reviews",
            error,
        });
    }
};


export const getAllUsers = async (
    _req: Request,
    res: Response,
): Promise<any> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                photo: true,
            },
        });
        res.send(users);
    } catch (error: any) {
        console.error("Failed to fetch users:", error);
        res.status(500).send({ message: error.message });
    }
};

// For dev purposes only
export const seedUsers = async (req: Request, res: Response): Promise<any> => {
    const usersData = req.body;

    // Validate input is an array
    if (!Array.isArray(usersData)) {
        return res
            .status(400)
            .send({ message: "Request body must be an array of users" });
    }

    const results = {
        created: 0,
        failed: 0,
        errors: [] as any[],
    };

    console.log(`🌱 Starting bulk user seeding: ${usersData.length} users`);

    // Process users one by one to handle duplicates gracefully
    for (let i = 0; i < usersData.length; i++) {
        const userData = usersData[i];

        // Validate user data
        const validationResult = UserSchema.safeParse(userData);
        if (!validationResult.success) {
            results.failed++;
            results.errors.push({
                index: i,
                email: userData.email,
                error: "Validation failed",
                details: validationResult.error.errors,
            });
            continue;
        }

        const validatedData = validationResult.data;

        try {
            // Check if user already exists
            const userExists = await prisma.user.findUnique({
                where: { email: validatedData.email },
            });

            if (userExists) {
                results.failed++;
                results.errors.push({
                    index: i,
                    email: validatedData.email,
                    error: "User already exists",
                });
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(
                validatedData.password,
                12,
            );
            validatedData.password = hashedPassword;

            // Create user
            await prisma.user.create({
                data: validatedData,
            });

            results.created++;

            // Log progress every 10 users
            if ((i + 1) % 10 === 0) {
                console.log(
                    `   ✓ Progress: ${i + 1}/${usersData.length} processed`,
                );
            }
        } catch (error: any) {
            results.failed++;
            results.errors.push({
                index: i,
                email: validatedData.email,
                error: error.message,
            });
        }
    }

    console.log(
        `✅ Seeding complete: ${results.created} created, ${results.failed} failed`,
    );

    res.status(201).send({
        message: `Bulk seed completed: ${results.created} users created, ${results.failed} failed`,
        results,
    });
};
