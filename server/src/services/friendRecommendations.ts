import { PrismaClient } from "@prisma/client";
import {
    FriendRecommendationsResult,
    FriendRecommendation,
} from "../lib/entities";
import {
    MIN_REVIEWS_FOR_RECOMMENDATIONS,
    getSimilarUsersForUser,
} from "./userSimilarity";

const MAX_FRIEND_RECOMMENDATIONS = 5;
const RECOMMENDATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const isFresh = (generatedAt: Date) =>
    Date.now() - generatedAt.getTime() < RECOMMENDATION_CACHE_TTL_MS;

export const replaceFriendRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
    recommendations: FriendRecommendation[],
) => {
    const generatedAt = new Date();

    await prisma.friendRecommendationCache.deleteMany({
        where: { userId },
    });

    if (recommendations.length === 0) return;

    await prisma.friendRecommendationCache.createMany({
        data: recommendations.map((recommendation) => ({
            userId,
            recommendedUserId: recommendation.user.id,
            similarityScore: recommendation.similarityScore,
            sharedMovieCount: recommendation.sharedMovieCount,
            sharedFavoriteTitles: recommendation.sharedFavoriteTitles,
            generatedAt,
        })),
    });
};

const getCachedFriendRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<FriendRecommendationsResult | null> => {
    const [cachedRecommendations, currentReviewCount] = await Promise.all([
        prisma.friendRecommendationCache.findMany({
            where: { userId },
            orderBy: [
                { similarityScore: "desc" },
                { sharedMovieCount: "desc" },
            ],
            select: {
                similarityScore: true,
                sharedMovieCount: true,
                sharedFavoriteTitles: true,
                generatedAt: true,
                recommendedUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        photo: true,
                    },
                },
            },
        }),
        prisma.review.count({
            where: {
                userId,
                mediaType: "MOVIE",
            },
        }),
    ]);

    if (
        cachedRecommendations.length === 0 ||
        cachedRecommendations.some(
            (recommendation) => !isFresh(recommendation.generatedAt),
        )
    ) {
        return null;
    }

    return {
        recommendations: cachedRecommendations.map((recommendation) => ({
            user: recommendation.recommendedUser,
            similarityScore: recommendation.similarityScore,
            sharedMovieCount: recommendation.sharedMovieCount,
            sharedFavoriteTitles: recommendation.sharedFavoriteTitles,
        })),
        currentReviewCount,
        minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
        recommendationsAvailable:
            currentReviewCount >= MIN_REVIEWS_FOR_RECOMMENDATIONS,
    };
};

const computeFriendRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<FriendRecommendationsResult> => {
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
            currentReviewCount: 0,
            minReviewsRequired: 3,
            recommendationsAvailable: false,
        };
    }

    const excludedUserIds = new Set([
        userId,
        ...user.friendsIds,
        ...user.sentFriendRequests.map((request) => request.receivedUserId),
        ...user.receivedFriendRequests.map((request) => request.sentUserId),
    ]);

    const similarityResult = await getSimilarUsersForUser(
        prisma,
        userId,
        [...excludedUserIds],
    );

    if (!similarityResult.recommendationsAvailable) {
        return {
            recommendations: [],
            currentReviewCount: similarityResult.currentReviewCount,
            minReviewsRequired: similarityResult.minReviewsRequired,
            recommendationsAvailable: false,
        };
    }

    const scoredRecommendations = similarityResult.similarUsers
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
        prisma.mediaItem.findMany({
            where: {
                type: "MOVIE",
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
        currentReviewCount: similarityResult.currentReviewCount,
        minReviewsRequired: similarityResult.minReviewsRequired,
        recommendationsAvailable: true,
    };
};

export const getFriendRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<FriendRecommendationsResult> => {
    const cachedRecommendations = await getCachedFriendRecommendationsForUser(
        prisma,
        userId,
    );

    if (cachedRecommendations) return cachedRecommendations;

    const recommendations = await computeFriendRecommendationsForUser(
        prisma,
        userId,
    );

    await replaceFriendRecommendationsForUser(
        prisma,
        userId,
        recommendations.recommendations,
    );

    return recommendations;
};
