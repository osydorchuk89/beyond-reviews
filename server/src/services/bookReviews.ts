import { PrismaClient } from "@prisma/client";

import { ReviewSchema } from "../lib/schemas";
import { ServiceError } from "./errors";

interface CreateOrUpdateBookReviewArgs {
    bookId: string;
    userId: string;
    rating: number;
    text?: string;
    date: Date | string;
}

interface LikeOrUnlikeBookReviewArgs {
    reviewId: string;
    userId: string;
    like: boolean;
}

export const createOrUpdateBookReviewForUser = async (
    prisma: PrismaClient,
    { bookId, userId, rating, text, date }: CreateOrUpdateBookReviewArgs,
) => {
    const validationResult = ReviewSchema.safeParse({
        rating,
        text,
    });

    if (!validationResult.success) {
        throw new ServiceError(400, "Validation failed");
    }

    const book = await prisma.book.findUnique({
        where: { id: bookId },
    });

    if (!book) {
        throw new ServiceError(404, "Book not found");
    }

    return prisma.$transaction(async (tx) => {
        const existingReview = await tx.review.findFirst({
            where: {
                bookId,
                userId,
                mediaType: "BOOK",
            },
        });
        const review = existingReview
            ? await tx.review.update({
                  where: { id: existingReview.id },
                  data: {
                      ...validationResult.data,
                      date,
                  },
              })
            : await tx.review.create({
                  data: {
                      ...validationResult.data,
                      userId,
                      bookId,
                      mediaType: "BOOK",
                      date,
                  },
              });

        const aggregations = await tx.review.aggregate({
            where: {
                bookId,
                mediaType: "BOOK",
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            },
        });

        await tx.book.update({
            where: { id: bookId },
            data: {
                avgRating: aggregations._avg.rating ?? 0,
                numRatings: aggregations._count.rating,
            },
        });

        await tx.activity.create({
            data: {
                userId,
                bookId,
                action: "rated",
                reviewRating: review.rating,
                reviewText: review.text,
                date: new Date(),
            },
        });

        return review;
    });
};

export const likeOrUnlikeBookReviewForUser = async (
    prisma: PrismaClient,
    { reviewId, userId, like }: LikeOrUnlikeBookReviewArgs,
) => {
    const bookReview = await prisma.review.findFirst({
        where: {
            id: reviewId,
            mediaType: "BOOK",
        },
    });

    if (!bookReview) {
        throw new ServiceError(404, "Could not find review");
    }

    await prisma.$transaction(async (tx) => {
        if (like) {
            await tx.reviewLike.create({
                data: {
                    reviewId: bookReview.id,
                    userId,
                },
            });
            await tx.review.update({
                where: { id: bookReview.id },
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
                        reviewId: bookReview.id,
                        userId,
                    },
                },
            });
            await tx.review.update({
                where: { id: bookReview.id },
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
                reviewId: bookReview.id,
                action: like ? "liked" : "unliked",
                date: new Date(),
            },
        });
    });
};
