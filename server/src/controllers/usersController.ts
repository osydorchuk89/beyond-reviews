import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

import { DEFAULT_USER_PHOTO_URL } from "../config/constants";
import { UserSchema } from "../lib/schemas";
import { login } from "./authController";
import { getFriendRecommendationsForUser } from "../services/friendRecommendations";
import { getMovieRecommendationsForUser } from "../services/movieRecommendations";
import {
    acceptFriendRequestFromUser,
    sendFriendRequestToUser,
} from "../services/friendships";
import { getErrorMessage, getErrorStatusCode } from "../services/errors";
import {
    toMovieResponse,
    toMovieReviewResponse,
    toMovieWatchlistResponse,
} from "../lib/media";

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
        userData.photo = DEFAULT_USER_PHOTO_URL;
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
                    mediaItem: {
                        select: {
                            title: true,
                            releaseYear: true,
                            image: true,
                            movie: true,
                        },
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            photo: true,
                        },
                    },
                    review: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                            mediaItem: {
                                select: {
                                    id: true,
                                    title: true,
                                    releaseYear: true,
                                    image: true,
                                    movie: true,
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

        const movieActivities = activities.map((activity) => {
            const { mediaItem, mediaItemId, review, reviewId, ...rest } =
                activity;
            return {
                ...rest,
                movieId: mediaItemId,
                movie: mediaItem ? toMovieResponse(mediaItem) : mediaItem,
                movieReviewId: reviewId,
                movieReview: review
                    ? {
                          ...toMovieReviewResponse(review),
                          movie: toMovieResponse(review.mediaItem),
                      }
                    : review,
            };
        });

        res.status(200).send({
            activities: movieActivities,
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

export const getUserFriendRecommendations = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;

    try {
        const recommendations = await getFriendRecommendationsForUser(
            prisma,
            userId,
        );
        res.status(200).send(recommendations);
    } catch (error: any) {
        res.status(500).send({
            message: "Could not fetch friend recommendations",
            error,
        });
    }
};

export const getUserMovieRecommendations = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { userId } = req.params;

    try {
        const recommendations = await getMovieRecommendationsForUser(
            prisma,
            userId,
        );
        res.status(200).send(recommendations);
    } catch (error: any) {
        res.status(500).send({
            message: "Could not fetch movie recommendations",
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

    try {
        await sendFriendRequestToUser(prisma, {
            userId,
            otherUserId,
        });
        res.status(200).send();
    } catch (error: any) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not send friend request"),
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

    try {
        await acceptFriendRequestFromUser(prisma, {
            userId,
            otherUserId,
        });

        res.status(200).send();
    } catch (error: any) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not accept friend request"),
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
        const watchlist = await prisma.savedItem.findMany({
            where: {
                userId,
                mediaType: "MOVIE",
            },
            include: {
                mediaItem: {
                    select: {
                        title: true,
                        releaseYear: true,
                        genres: true,
                        avgRating: true,
                        numRatings: true,
                        image: true,
                        movie: true,
                    },
                },
            },
        });
        res.status(200).send(watchlist.map(toMovieWatchlistResponse));
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
    const page = parseInt(req.query.page as string) ?? 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    try {
        const [reviews, totalCount] = await Promise.all([
            prisma.review.findMany({
                where: {
                    userId,
                    mediaType: "MOVIE",
                },
                include: {
                    mediaItem: {
                        select: {
                            id: true,
                            title: true,
                            releaseYear: true,
                            image: true,
                            movie: true,
                        },
                    },
                },
                orderBy: { date: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({
                where: {
                    userId,
                    mediaType: "MOVIE",
                },
            }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        res.status(200).send({
            reviews: reviews.map((review) => {
                const { mediaItem, ...reviewData } = review;
                return {
                    ...toMovieReviewResponse(reviewData),
                    movie: toMovieResponse(mediaItem),
                };
            }),
            totalCount,
            currentPage: page,
            totalPages,
            hasMore,
        });
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
