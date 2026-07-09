import { PrismaClient } from "@prisma/client";
import {
    FriendRecommendationsResult,
    FriendRecommendation,
} from "../lib/entities";
import {
    MIN_REVIEWS_FOR_RECOMMENDATIONS,
    getSimilarBookUsersForUser,
    getSimilarUsersForUser,
} from "./userSimilarity";

const MAX_FRIEND_RECOMMENDATIONS = 5;
const RECOMMENDATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FRIEND_RECOMMENDATION_CACHE_VERSION = 3;

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
            sharedBookCount: recommendation.sharedBookCount,
            sharedFavoriteMovieIds: recommendation.sharedFavoriteItems
                .filter((item) => item.mediaType === "MOVIE")
                .map((item) => item.id),
            sharedFavoriteBookIds: recommendation.sharedFavoriteItems
                .filter((item) => item.mediaType === "BOOK")
                .map((item) => item.id),
            sharedFavoriteTitles: recommendation.sharedFavoriteTitles,
            cacheVersion: FRIEND_RECOMMENDATION_CACHE_VERSION,
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
                { sharedBookCount: "desc" },
            ],
            select: {
                similarityScore: true,
                sharedMovieCount: true,
                sharedBookCount: true,
                sharedFavoriteMovieIds: true,
                sharedFavoriteBookIds: true,
                sharedFavoriteTitles: true,
                cacheVersion: true,
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
                mediaType: {
                    in: ["MOVIE", "BOOK"],
                },
            },
        }),
    ]);

    if (
        cachedRecommendations.length === 0 ||
        cachedRecommendations.some(
            (recommendation) =>
                recommendation.cacheVersion !==
                    FRIEND_RECOMMENDATION_CACHE_VERSION ||
                !isFresh(recommendation.generatedAt),
        )
    ) {
        return null;
    }

    const sharedFavoriteMovieIds = [
        ...new Set(
            cachedRecommendations.flatMap(
                (recommendation) => recommendation.sharedFavoriteMovieIds,
            ),
        ),
    ];
    const sharedFavoriteBookIds = [
        ...new Set(
            cachedRecommendations.flatMap(
                (recommendation) => recommendation.sharedFavoriteBookIds,
            ),
        ),
    ];
    const [sharedFavoriteMovies, sharedFavoriteBooks] = await Promise.all([
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
        prisma.book.findMany({
            where: {
                id: {
                    in: sharedFavoriteBookIds,
                },
            },
            select: {
                id: true,
                title: true,
            },
        }),
    ]);
    const sharedFavoriteMoviesById = new Map(
        sharedFavoriteMovies.map((movie) => [movie.id, movie]),
    );
    const sharedFavoriteBooksById = new Map(
        sharedFavoriteBooks.map((book) => [book.id, book]),
    );

    return {
        recommendations: cachedRecommendations.map((recommendation) => {
            const sharedFavoriteItems = [
                ...recommendation.sharedFavoriteMovieIds
                    .map((movieId) => sharedFavoriteMoviesById.get(movieId))
                    .filter((movie) => movie !== undefined)
                    .map((movie) => ({
                        id: movie.id,
                        mediaType: "MOVIE" as const,
                        title: movie.title,
                    })),
                ...recommendation.sharedFavoriteBookIds
                    .map((bookId) => sharedFavoriteBooksById.get(bookId))
                    .filter((book) => book !== undefined)
                    .map((book) => ({
                        id: book.id,
                        mediaType: "BOOK" as const,
                        title: book.title,
                    })),
            ].slice(0, 3);

            return {
                user: recommendation.recommendedUser,
                similarityScore: recommendation.similarityScore,
                sharedMovieCount: recommendation.sharedMovieCount,
                sharedBookCount: recommendation.sharedBookCount,
                sharedFavoriteItems,
                sharedFavoriteTitles: sharedFavoriteItems.map(
                    (item) => item.title,
                ),
            };
        }),
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
            minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
            recommendationsAvailable: false,
        };
    }

    const excludedUserIds = new Set([
        userId,
        ...user.friendsIds,
        ...user.sentFriendRequests.map((request) => request.receivedUserId),
        ...user.receivedFriendRequests.map((request) => request.sentUserId),
    ]);

    const [movieSimilarityResult, bookSimilarityResult] = await Promise.all([
        getSimilarUsersForUser(prisma, userId, [...excludedUserIds]),
        getSimilarBookUsersForUser(prisma, userId, [...excludedUserIds]),
    ]);

    const hasMovieSignal = movieSimilarityResult.recommendationsAvailable;
    const hasBookSignal = bookSimilarityResult.recommendationsAvailable;
    const currentReviewCount = Math.max(
        movieSimilarityResult.currentReviewCount,
        bookSimilarityResult.currentReviewCount,
    );

    if (!hasMovieSignal && !hasBookSignal) {
        return {
            recommendations: [],
            currentReviewCount,
            minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
            recommendationsAvailable: false,
        };
    }

    const movieWeight =
        hasMovieSignal && hasBookSignal ? 0.5 : hasMovieSignal ? 1 : 0;
    const bookWeight =
        hasMovieSignal && hasBookSignal ? 0.5 : hasBookSignal ? 1 : 0;
    const combinedRecommendationsByUserId = new Map<
        string,
        {
            userId: string;
            similarityScore: number;
            sharedMovieCount: number;
            sharedBookCount: number;
            sharedFavoriteMovieIds: string[];
            sharedFavoriteBookIds: string[];
        }
    >();

    for (const recommendation of movieSimilarityResult.similarUsers) {
        combinedRecommendationsByUserId.set(recommendation.userId, {
            userId: recommendation.userId,
            similarityScore: recommendation.similarityScore * movieWeight,
            sharedMovieCount: recommendation.sharedMovieCount,
            sharedBookCount: 0,
            sharedFavoriteMovieIds: recommendation.sharedFavoriteMovieIds,
            sharedFavoriteBookIds: [],
        });
    }

    for (const recommendation of bookSimilarityResult.similarUsers) {
        const combined = combinedRecommendationsByUserId.get(
            recommendation.userId,
        );

        if (combined) {
            combined.similarityScore +=
                recommendation.similarityScore * bookWeight;
            combined.sharedBookCount = recommendation.sharedBookCount;
            combined.sharedFavoriteBookIds = recommendation.sharedFavoriteBookIds;
            continue;
        }

        combinedRecommendationsByUserId.set(recommendation.userId, {
            userId: recommendation.userId,
            similarityScore: recommendation.similarityScore * bookWeight,
            sharedMovieCount: 0,
            sharedBookCount: recommendation.sharedBookCount,
            sharedFavoriteMovieIds: [],
            sharedFavoriteBookIds: recommendation.sharedFavoriteBookIds,
        });
    }

    const scoredRecommendations = [...combinedRecommendationsByUserId.values()]
        .filter((recommendation) => recommendation.similarityScore > 0)
        .sort((a, b) => {
            if (b.similarityScore !== a.similarityScore) {
                return b.similarityScore - a.similarityScore;
            }

            const bSharedCount = b.sharedMovieCount + b.sharedBookCount;
            const aSharedCount = a.sharedMovieCount + a.sharedBookCount;
            return bSharedCount - aSharedCount;
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
    const sharedFavoriteBookIds = [
        ...new Set(
            scoredRecommendations.flatMap(
                (recommendation) => recommendation.sharedFavoriteBookIds,
            ),
        ),
    ];

    const [recommendedUsers, sharedFavoriteMovies, sharedFavoriteBooks] =
        await Promise.all([
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
            prisma.book.findMany({
                where: {
                    id: {
                        in: sharedFavoriteBookIds,
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
    const sharedFavoriteBooksById = new Map(
        sharedFavoriteBooks.map((book) => [book.id, book]),
    );
    const recommendations = scoredRecommendations
        .map((recommendation) => {
            const user = recommendedUsersById.get(recommendation.userId);
            if (!user) return null;

            const sharedFavoriteItems = [
                ...recommendation.sharedFavoriteMovieIds
                    .map((movieId) => sharedFavoriteMoviesById.get(movieId))
                    .filter((movie) => movie !== undefined)
                    .map((movie) => ({
                        id: movie.id,
                        mediaType: "MOVIE" as const,
                        title: movie.title,
                    })),
                ...recommendation.sharedFavoriteBookIds
                    .map((bookId) => sharedFavoriteBooksById.get(bookId))
                    .filter((book) => book !== undefined)
                    .map((book) => ({
                        id: book.id,
                        mediaType: "BOOK" as const,
                        title: book.title,
                    })),
            ].slice(0, 3);

            return {
                user,
                similarityScore: recommendation.similarityScore,
                sharedMovieCount: recommendation.sharedMovieCount,
                sharedBookCount: recommendation.sharedBookCount,
                sharedFavoriteItems,
                sharedFavoriteTitles: sharedFavoriteItems.map(
                    (item) => item.title,
                ),
            };
        })
        .filter(
            (recommendation): recommendation is FriendRecommendation =>
                recommendation !== null,
        );

    return {
        recommendations,
        currentReviewCount,
        minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
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
