import { PrismaClient } from "@prisma/client";

import { ReviewSchema } from "../lib/schemas";
import { ServiceError } from "./errors";
import { invalidateMovieRecommendationsForUser } from "./movieRecommendations";

interface CreateOrUpdateMovieReviewArgs {
    movieId: string;
    userId: string;
    rating: number;
    text?: string;
    date: Date | string;
}

interface LikeOrUnlikeMovieReviewArgs {
    reviewId: string;
    userId: string;
    like: boolean;
}

export const createOrUpdateMovieReviewForUser = async (
    prisma: PrismaClient,
    { movieId, userId, rating, text, date }: CreateOrUpdateMovieReviewArgs,
) => {
    const validationResult = ReviewSchema.safeParse({
        rating,
        text,
    });

    if (!validationResult.success) {
        throw new ServiceError(400, "Validation failed");
    }

    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
    });

    if (!movie) {
        throw new ServiceError(404, "Movie not found");
    }

    return prisma.$transaction(async (tx) => {
        const review = await tx.review.upsert({
            where: {
                movieId_userId: {
                    userId,
                    movieId,
                },
            },
            update: {
                ...validationResult.data,
                date,
            },
            create: {
                ...validationResult.data,
                userId,
                movieId,
                mediaType: "MOVIE",
                date,
            },
        });

        const aggregations = await tx.review.aggregate({
            where: {
                movieId,
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        await tx.movie.update({
            where: { id: movieId },
            data: {
                avgRating: aggregations._avg.rating ?? 0,
                numRatings: aggregations._count.rating,
            },
        });

        await tx.activity.create({
            data: {
                userId,
                movieId,
                action: "rated",
                reviewRating: review.rating,
                reviewText: review.text,
                date: new Date(),
            },
        });

        await invalidateMovieRecommendationsForUser(tx, userId);

        return review;
    });
};

export const likeOrUnlikeMovieReviewForUser = async (
    prisma: PrismaClient,
    { reviewId, userId, like }: LikeOrUnlikeMovieReviewArgs,
) => {
    const movieReview = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!movieReview) {
        throw new ServiceError(404, "Could not find review");
    }

    await prisma.$transaction(async (tx) => {
        if (like) {
            await tx.reviewLike.create({
                data: {
                    reviewId: movieReview.id,
                    userId,
                },
            });
            await tx.review.update({
                where: { id: movieReview.id },
                data: {
                    likeCount: {
                        increment: 1,
                    },
                },
            });
        } else {
            await tx.reviewLike.delete({
                where: {
                    reviewId_userId: {
                        reviewId: movieReview.id,
                        userId,
                    },
                },
            });
            await tx.review.update({
                where: { id: movieReview.id },
                data: {
                    likeCount: {
                        decrement: 1,
                    },
                },
            });
        }

        await tx.activity.create({
            data: {
                userId,
                reviewId: movieReview.id,
                action: like ? "liked" : "unliked",
                date: new Date(),
            },
        });
    });
};
