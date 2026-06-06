import { PrismaClient } from "@prisma/client";
import {
    FriendRecommendationsResult,
    FriendRecommendation,
} from "../lib/entities";
import { getSimilarUsersForUser } from "./userSimilarity";

const MAX_FRIEND_RECOMMENDATIONS = 5;

export const getFriendRecommendationsForUser = async (
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
        currentReviewCount: similarityResult.currentReviewCount,
        minReviewsRequired: similarityResult.minReviewsRequired,
        recommendationsAvailable: true,
    };
};
