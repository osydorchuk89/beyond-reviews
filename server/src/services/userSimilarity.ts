import { PrismaClient } from "@prisma/client";

import {
    CandidateRatingByMediaId,
    Rating,
    RatingByMediaId,
} from "../lib/entities.js";

export const MIN_REVIEWS_FOR_RECOMMENDATIONS = 3;
export const MAX_RATING_DIFFERENCE = 9;
export const FAVORITE_RATING_THRESHOLD = 8;

export interface SimilarUser {
    userId: string;
    similarityScore: number;
    sharedMovieCount: number;
    sharedFavoriteMovieIds: string[];
}

export interface UserSimilarityResult {
    userReviews: Rating[];
    similarUsers: SimilarUser[];
    currentReviewCount: number;
    minReviewsRequired: number;
    recommendationsAvailable: boolean;
}

export interface SimilarBookUser {
    userId: string;
    similarityScore: number;
    sharedBookCount: number;
    sharedFavoriteBookIds: string[];
}

export interface BookUserSimilarityResult {
    userReviews: RatingByMediaId[];
    similarUsers: SimilarBookUser[];
    currentReviewCount: number;
    minReviewsRequired: number;
    recommendationsAvailable: boolean;
}

export const calculateSimilarityScore = (
    userReviews: RatingByMediaId[],
    candidateReviews: RatingByMediaId[],
) => {
    const candidateRatingsByMediaId = new Map(
        candidateReviews.map((review) => [review.mediaId, review.rating]),
    );
    const sharedReviews = userReviews.filter((review) =>
        candidateRatingsByMediaId.has(review.mediaId),
    );

    if (sharedReviews.length === 0) return 0;

    const averageRatingDifference =
        sharedReviews.reduce((sum, review) => {
            const candidateRating = candidateRatingsByMediaId.get(
                review.mediaId,
            );
            return sum + Math.abs(review.rating - (candidateRating ?? 0));
        }, 0) / sharedReviews.length;

    const agreementScore = 1 - averageRatingDifference / MAX_RATING_DIFFERENCE;
    const overlapConfidence = Math.min(
        sharedReviews.length / MIN_REVIEWS_FOR_RECOMMENDATIONS,
        1,
    );

    return agreementScore * overlapConfidence;
};

interface SimilarMediaUser {
    userId: string;
    similarityScore: number;
    sharedMediaCount: number;
    sharedFavoriteMediaIds: string[];
}

const getSimilarMediaUsersFromReviews = (
    userReviews: RatingByMediaId[],
    candidateReviews: CandidateRatingByMediaId[],
): SimilarMediaUser[] => {
    const userReviewsByMediaId = new Map(
        userReviews.map((review) => [review.mediaId, review]),
    );
    const candidateReviewsByUserId = new Map<
        string,
        CandidateRatingByMediaId[]
    >();

    for (const review of candidateReviews) {
        const reviews = candidateReviewsByUserId.get(review.userId) ?? [];
        reviews.push(review);
        candidateReviewsByUserId.set(review.userId, reviews);
    }

    return [...candidateReviewsByUserId.values()]
        .map((reviews) => {
            const similarityScore = calculateSimilarityScore(
                userReviews,
                reviews,
            );
            const sharedFavoriteMediaIds = reviews
                .filter((review) => {
                    const userReview = userReviewsByMediaId.get(review.mediaId);
                    return (
                        review.rating >= FAVORITE_RATING_THRESHOLD &&
                        (userReview?.rating ?? 0) >= FAVORITE_RATING_THRESHOLD
                    );
                })
                .map((review) => review.mediaId)
                .slice(0, 3);

            return {
                userId: reviews[0].userId,
                similarityScore,
                sharedMediaCount: reviews.length,
                sharedFavoriteMediaIds,
            };
        })
        .filter((similarUser) => similarUser.similarityScore > 0)
        .sort((a, b) => {
            if (b.similarityScore !== a.similarityScore) {
                return b.similarityScore - a.similarityScore;
            }
            return b.sharedMediaCount - a.sharedMediaCount;
        });
};

export const getSimilarUsersForUser = async (
    prisma: PrismaClient,
    userId: string,
    excludedUserIds: string[] = [],
): Promise<UserSimilarityResult> => {
    const userReviewsByMediaId = (
        await prisma.review.findMany({
            where: {
                userId,
                mediaType: "MOVIE",
            },
            select: {
                movieId: true,
                rating: true,
            },
        })
    )
        .map((review) => ({
            mediaId: review.movieId ?? "",
            rating: review.rating,
        }))
        .filter((review) => review.mediaId);

    if (userReviewsByMediaId.length < MIN_REVIEWS_FOR_RECOMMENDATIONS) {
        return {
            userReviews: userReviewsByMediaId.map((review) => ({
                movieId: review.mediaId,
                rating: review.rating,
            })),
            similarUsers: [],
            currentReviewCount: userReviewsByMediaId.length,
            minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
            recommendationsAvailable: false,
        };
    }

    const userMovieIds = userReviewsByMediaId.map((review) => review.mediaId);
    const candidateReviews = (
        await prisma.review.findMany({
            where: {
                movieId: {
                    in: userMovieIds,
                },
                userId: {
                    notIn: [userId, ...excludedUserIds],
                },
                mediaType: "MOVIE",
            },
            select: {
                movieId: true,
                rating: true,
                userId: true,
            },
        })
    )
        .map((review) => ({
            mediaId: review.movieId ?? "",
            rating: review.rating,
            userId: review.userId,
        }))
        .filter((review) => review.mediaId);

    const similarUsers = getSimilarMediaUsersFromReviews(
        userReviewsByMediaId,
        candidateReviews,
    ).map((similarUser) => ({
        userId: similarUser.userId,
        similarityScore: similarUser.similarityScore,
        sharedMovieCount: similarUser.sharedMediaCount,
        sharedFavoriteMovieIds: similarUser.sharedFavoriteMediaIds,
    }));

    return {
        userReviews: userReviewsByMediaId.map((review) => ({
            movieId: review.mediaId,
            rating: review.rating,
        })),
        similarUsers,
        currentReviewCount: userReviewsByMediaId.length,
        minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
        recommendationsAvailable: true,
    };
};

export const getSimilarBookUsersForUser = async (
    prisma: PrismaClient,
    userId: string,
    excludedUserIds: string[] = [],
): Promise<BookUserSimilarityResult> => {
    const userReviews = (
        await prisma.review.findMany({
            where: {
                userId,
                mediaType: "BOOK",
            },
            select: {
                bookId: true,
                rating: true,
            },
        })
    )
        .map((review) => ({
            mediaId: review.bookId ?? "",
            rating: review.rating,
        }))
        .filter((review) => review.mediaId);

    if (userReviews.length < MIN_REVIEWS_FOR_RECOMMENDATIONS) {
        return {
            userReviews,
            similarUsers: [],
            currentReviewCount: userReviews.length,
            minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
            recommendationsAvailable: false,
        };
    }

    const userBookIds = userReviews.map((review) => review.mediaId);
    const candidateReviews = (
        await prisma.review.findMany({
            where: {
                bookId: {
                    in: userBookIds,
                },
                userId: {
                    notIn: [userId, ...excludedUserIds],
                },
                mediaType: "BOOK",
            },
            select: {
                bookId: true,
                rating: true,
                userId: true,
            },
        })
    )
        .map((review) => ({
            mediaId: review.bookId ?? "",
            rating: review.rating,
            userId: review.userId,
        }))
        .filter((review) => review.mediaId);

    const similarUsers = getSimilarMediaUsersFromReviews(
        userReviews,
        candidateReviews,
    ).map((similarUser) => ({
        userId: similarUser.userId,
        similarityScore: similarUser.similarityScore,
        sharedBookCount: similarUser.sharedMediaCount,
        sharedFavoriteBookIds: similarUser.sharedFavoriteMediaIds,
    }));

    return {
        userReviews,
        similarUsers,
        currentReviewCount: userReviews.length,
        minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
        recommendationsAvailable: true,
    };
};
