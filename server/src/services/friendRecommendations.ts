import { PrismaClient } from "@prisma/client";
import {
    Rating,
    FriendRecommendationsResult,
    CandidateRating,
    FriendRecommendation,
} from "../lib/entities";

const MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS = 3;
const MAX_FRIEND_RECOMMENDATIONS = 5;
const MAX_RATING_DIFFERENCE = 9;
const FAVORITE_RATING_THRESHOLD = 8;

const calculateSimilarityScore = (
    userReviews: Rating[],
    candidateReviews: Rating[],
) => {
    const candidateRatingsByMovieId = new Map(
        candidateReviews.map((review) => [review.movieId, review.rating]),
    );
    const sharedReviews = userReviews.filter((review) =>
        candidateRatingsByMovieId.has(review.movieId),
    );

    if (sharedReviews.length === 0) return 0;

    const averageRatingDifference =
        sharedReviews.reduce((sum, review) => {
            const candidateRating = candidateRatingsByMovieId.get(
                review.movieId,
            );
            return sum + Math.abs(review.rating - (candidateRating ?? 0));
        }, 0) / sharedReviews.length;

    const agreementScore =
        1 - averageRatingDifference / MAX_RATING_DIFFERENCE;
    const overlapConfidence = Math.min(
        sharedReviews.length / MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS,
        1,
    );

    return agreementScore * overlapConfidence;
};

export const getFriendRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<FriendRecommendationsResult> => {
    const userReviews = await prisma.movieReview.findMany({
        where: { userId },
        select: {
            movieId: true,
            rating: true,
            movie: {
                select: {
                    title: true,
                },
            },
        },
    });

    if (userReviews.length < MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS) {
        return {
            recommendations: [],
            currentReviewCount: userReviews.length,
            minReviewsRequired: MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS,
            recommendationsAvailable: false,
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            friendsIds: true,
            sentFriendRequests: {
                select: {
                    receivedUserId: true,
                },
            },
            receivedFriendRequests: {
                select: {
                    sentUserId: true,
                },
            },
        },
    });

    if (!user) {
        return {
            recommendations: [],
            currentReviewCount: userReviews.length,
            minReviewsRequired: MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS,
            recommendationsAvailable: true,
        };
    }

    const excludedUserIds = new Set([
        userId,
        ...user.friendsIds,
        ...user.sentFriendRequests.map((request) => request.receivedUserId),
        ...user.receivedFriendRequests.map((request) => request.sentUserId),
    ]);

    const userMovieIds = userReviews.map((review) => review.movieId);
    const candidateReviews = await prisma.movieReview.findMany({
        where: {
            movieId: {
                in: userMovieIds,
            },
            userId: {
                notIn: [...excludedUserIds],
            },
        },
        select: {
            movieId: true,
            rating: true,
            userId: true,
        },
    });

    const userReviewsByMovieId = new Map(
        userReviews.map((review) => [review.movieId, review]),
    );
    const candidateReviewsByUserId = new Map<string, CandidateRating[]>();

    for (const review of candidateReviews) {
        const reviews = candidateReviewsByUserId.get(review.userId) ?? [];
        reviews.push(review);
        candidateReviewsByUserId.set(review.userId, reviews);
    }

    const scoredRecommendations = [...candidateReviewsByUserId.values()]
        .map((reviews) => {
            const similarityScore = calculateSimilarityScore(
                userReviews,
                reviews,
            );
            const sharedFavoriteTitles = reviews
                .filter((review) => {
                    const userReview = userReviewsByMovieId.get(review.movieId);
                    return (
                        review.rating >= FAVORITE_RATING_THRESHOLD &&
                        (userReview?.rating ?? 0) >= FAVORITE_RATING_THRESHOLD
                    );
                })
                .map((review) => review.movieId)
                .slice(0, 3);

            return {
                userId: reviews[0].userId,
                similarityScore,
                sharedMovieCount: reviews.length,
                sharedFavoriteMovieIds: sharedFavoriteTitles,
            };
        })
        .filter((recommendation) => recommendation.similarityScore > 0)
        .sort((a, b) => {
            if (b.similarityScore !== a.similarityScore) {
                return b.similarityScore - a.similarityScore;
            }
            return b.sharedMovieCount - a.sharedMovieCount;
        })
        .slice(0, MAX_FRIEND_RECOMMENDATIONS);

    const recommendedUserIds = scoredRecommendations.map(
        (recommendation) => recommendation.userId,
    );
    const sharedFavoriteMovieIds = [
        ...new Set(
            scoredRecommendations.flatMap(
                (recommendation) => recommendation.sharedFavoriteMovieIds,
            ),
        ),
    ];

    const [recommendedUsers, sharedFavoriteMovies] = await Promise.all([
        prisma.user.findMany({
            where: {
                id: {
                    in: recommendedUserIds,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                photo: true,
            },
        }),
        prisma.movie.findMany({
            where: {
                id: {
                    in: sharedFavoriteMovieIds,
                },
            },
            select: {
                id: true,
                title: true,
            },
        }),
    ]);

    const recommendedUsersById = new Map(
        recommendedUsers.map((user) => [user.id, user]),
    );
    const sharedFavoriteMoviesById = new Map(
        sharedFavoriteMovies.map((movie) => [movie.id, movie]),
    );
    const recommendations = scoredRecommendations
        .map((recommendation) => {
            const user = recommendedUsersById.get(recommendation.userId);
            if (!user) return null;

            return {
                user,
                similarityScore: recommendation.similarityScore,
                sharedMovieCount: recommendation.sharedMovieCount,
                sharedFavoriteTitles: recommendation.sharedFavoriteMovieIds
                    .map((movieId) => sharedFavoriteMoviesById.get(movieId))
                    .filter((movie) => movie !== undefined)
                    .map((movie) => movie.title),
            };
        })
        .filter(
            (recommendation): recommendation is FriendRecommendation =>
                recommendation !== null,
        );

    return {
        recommendations,
        currentReviewCount: userReviews.length,
        minReviewsRequired: MIN_REVIEWS_FOR_FRIEND_RECOMMENDATIONS,
        recommendationsAvailable: true,
    };
};
