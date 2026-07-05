import { Prisma, PrismaClient } from "@prisma/client";

import {
    BookRecommendation,
    BookRecommendationsResult,
    PreferenceStats,
} from "../lib/entities";
import { toBookResponse } from "../lib/media";
import {
    FAVORITE_RATING_THRESHOLD,
    MIN_REVIEWS_FOR_RECOMMENDATIONS,
    getSimilarBookUsersForUser,
} from "./userSimilarity";

const RECOMMENDATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const RECOMMENDATION_LIMITS = {
    maxSimilarUsers: 30,
    maxBookRecommendations: 12,
};

const SCORE_WEIGHTS = {
    content: 0.65,
    collaborative: 0.15,
    publicQuality: 0.1,
    publicConfidence: 0.1,
};

const CONTENT_WEIGHTS = {
    genre: 0.4,
    author: 0.3,
    keyword: 0.2,
    decade: 0.1,
};

const CONFIDENCE_COUNTS = {
    genre: 12,
    author: 3,
    keyword: 4,
    decade: 25,
    publicQualityRatings: 50,
    publicRankingRatings: 50,
};

const NEUTRAL_SCORE = 5;
const MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL = 4;
const MIN_SPECIFIC_AFFINITY = 0.08;

interface CandidateBook {
    id: string;
    title: string;
    releaseYear: number;
    genres: string[];
    keywords: string[];
    authors: string[];
    avgRating: number;
    numRatings: number;
    image: string;
}

interface BookTasteProfile {
    genres: Map<string, PreferenceStats>;
    authors: Map<string, PreferenceStats>;
    keywords: Map<string, PreferenceStats>;
    decades: Map<number, PreferenceStats>;
    averageRating: number;
}

interface ReviewedBookForProfile {
    bookId: string;
    rating: number;
    book: {
        genres: string[];
        authors: string[];
        keywords: string[];
        releaseYear: number;
    };
}

type RecommendationPrismaClient = PrismaClient | Prisma.TransactionClient;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const getDecade = (releaseYear: number) => Math.floor(releaseYear / 10) * 10;

const normalizeProfileTerm = (term: string) => term.trim().toLowerCase();

const addPreference = <T>(
    preferences: Map<T, PreferenceStats>,
    key: T,
    preference: number,
) => {
    const stats = preferences.get(key) ?? { total: 0, count: 0 };
    stats.total += preference;
    stats.count += 1;
    preferences.set(key, stats);
};

const buildBookTasteProfile = (
    reviewedBooks: ReviewedBookForProfile[],
): BookTasteProfile => {
    const averageRating =
        reviewedBooks.length > 0
            ? reviewedBooks.reduce((sum, review) => sum + review.rating, 0) /
              reviewedBooks.length
            : NEUTRAL_SCORE;
    const profile: BookTasteProfile = {
        genres: new Map(),
        authors: new Map(),
        keywords: new Map(),
        decades: new Map(),
        averageRating,
    };

    for (const review of reviewedBooks) {
        const preference = clamp(
            (review.rating - averageRating) /
                MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL,
            -1,
            1,
        );
        if (preference === 0) continue;

        for (const genre of review.book.genres) {
            addPreference(profile.genres, genre, preference);
        }
        for (const author of review.book.authors) {
            addPreference(
                profile.authors,
                normalizeProfileTerm(author),
                preference,
            );
        }
        for (const keyword of review.book.keywords) {
            addPreference(
                profile.keywords,
                normalizeProfileTerm(keyword),
                preference,
            );
        }

        addPreference(
            profile.decades,
            getDecade(review.book.releaseYear),
            preference,
        );
    }

    return profile;
};

const getAveragePreference = <T>(
    preferences: Map<T, PreferenceStats>,
    key: T,
    confidenceCount: number,
) => {
    const stats = preferences.get(key);
    if (!stats) return 0;

    const confidence = clamp(stats.count / confidenceCount, 0, 1);
    return clamp((stats.total / stats.count) * confidence, -1, 1);
};

const preferenceToScore = (preference: number) =>
    clamp((preference + 1) * 5, 0, 10);

const getAverageArrayPreference = (
    preferences: Map<string, PreferenceStats>,
    values: string[],
    confidenceCount: number,
) => {
    if (values.length === 0) return 0;

    const matchedPreferences = values
        .map((value) =>
            getAveragePreference(
                preferences,
                normalizeProfileTerm(value),
                confidenceCount,
            ),
        )
        .filter((preference) => preference !== 0);

    if (matchedPreferences.length === 0) return 0;

    return (
        matchedPreferences.reduce((sum, preference) => sum + preference, 0) /
        matchedPreferences.length
    );
};

const getContentSignals = (book: CandidateBook, profile: BookTasteProfile) => {
    const genrePreference =
        book.genres.length === 0
            ? 0
            : book.genres.reduce(
                  (sum, genre) =>
                      sum +
                      getAveragePreference(
                          profile.genres,
                          genre,
                          CONFIDENCE_COUNTS.genre,
                      ),
                  0,
              ) / book.genres.length;
    const authorPreference = getAverageArrayPreference(
        profile.authors,
        book.authors,
        CONFIDENCE_COUNTS.author,
    );
    const keywordPreference = getAverageArrayPreference(
        profile.keywords,
        book.keywords,
        CONFIDENCE_COUNTS.keyword,
    );
    const decadePreference = getAveragePreference(
        profile.decades,
        getDecade(book.releaseYear),
        CONFIDENCE_COUNTS.decade,
    );
    const hasSpecificAffinity =
        genrePreference >= MIN_SPECIFIC_AFFINITY ||
        authorPreference >= MIN_SPECIFIC_AFFINITY ||
        keywordPreference >= MIN_SPECIFIC_AFFINITY;
    const effectiveDecadePreference = hasSpecificAffinity
        ? decadePreference
        : Math.min(decadePreference, 0);

    return {
        score:
            preferenceToScore(genrePreference) * CONTENT_WEIGHTS.genre +
            preferenceToScore(authorPreference) * CONTENT_WEIGHTS.author +
            preferenceToScore(keywordPreference) * CONTENT_WEIGHTS.keyword +
            preferenceToScore(effectiveDecadePreference) *
                CONTENT_WEIGHTS.decade,
        hasSpecificAffinity,
    };
};

const getPublicQualityScore = (book: CandidateBook) => {
    const confidence = clamp(
        book.numRatings / CONFIDENCE_COUNTS.publicQualityRatings,
        0,
        1,
    );

    return book.avgRating * confidence + NEUTRAL_SCORE * (1 - confidence);
};

const getPublicConfidenceScore = (book: CandidateBook) => {
    const confidence = clamp(
        Math.sqrt(book.numRatings / CONFIDENCE_COUNTS.publicRankingRatings),
        0,
        1,
    );

    return NEUTRAL_SCORE + confidence * NEUTRAL_SCORE;
};

const isFresh = (generatedAt: Date) =>
    Date.now() - generatedAt.getTime() < RECOMMENDATION_CACHE_TTL_MS;

export const replaceBookRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
    recommendations: BookRecommendation[],
) => {
    const generatedAt = new Date();

    await prisma.recommendationCache.deleteMany({
        where: { userId, mediaType: "BOOK" },
    });

    if (recommendations.length === 0) return;

    await prisma.recommendationCache.createMany({
        data: recommendations.map((recommendation) => ({
            userId,
            mediaType: "BOOK",
            bookId: recommendation.book.id,
            score: recommendation.score,
            recommendedByCount: recommendation.recommendedByCount,
            generatedAt,
        })),
    });
};

export const invalidateBookRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
) => {
    await prisma.recommendationCache.deleteMany({
        where: { userId, mediaType: "BOOK" },
    });
};

const getCachedBookRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<BookRecommendationsResult | null> => {
    const [cachedRecommendations, currentReviewCount] = await Promise.all([
        prisma.recommendationCache.findMany({
            where: {
                userId,
                mediaType: "BOOK",
            },
            orderBy: [{ score: "desc" }, { recommendedByCount: "desc" }],
            select: {
                score: true,
                recommendedByCount: true,
                generatedAt: true,
                book: {
                    select: {
                        id: true,
                        title: true,
                        releaseYear: true,
                        genres: true,
                        keywords: true,
                        avgRating: true,
                        numRatings: true,
                        image: true,
                        authors: true,
                    },
                },
            },
        }),
        prisma.review.count({
            where: {
                userId,
                mediaType: "BOOK",
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
        recommendations: cachedRecommendations
            .filter((recommendation) => recommendation.book !== null)
            .map((recommendation) => ({
                book: toBookResponse(recommendation.book!),
                score: recommendation.score,
                recommendedByCount: recommendation.recommendedByCount,
            })),
        currentReviewCount,
        minReviewsRequired: MIN_REVIEWS_FOR_RECOMMENDATIONS,
        recommendationsAvailable:
            currentReviewCount >= MIN_REVIEWS_FOR_RECOMMENDATIONS,
    };
};

const computeBookRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<BookRecommendationsResult> => {
    const similarityResult = await getSimilarBookUsersForUser(prisma, userId);

    if (!similarityResult.recommendationsAvailable) {
        return {
            recommendations: [],
            currentReviewCount: similarityResult.currentReviewCount,
            minReviewsRequired: similarityResult.minReviewsRequired,
            recommendationsAvailable: false,
        };
    }

    const similarUsers = similarityResult.similarUsers.slice(
        0,
        RECOMMENDATION_LIMITS.maxSimilarUsers,
    );

    const [userWishlist, reviewedBooks] = await Promise.all([
        prisma.wishlistItem.findMany({
            where: {
                userId,
                mediaType: "BOOK",
            },
            select: {
                bookId: true,
            },
        }),
        prisma.review.findMany({
            where: {
                userId,
                mediaType: "BOOK",
            },
            select: {
                bookId: true,
                rating: true,
                book: {
                    select: {
                        genres: true,
                        keywords: true,
                        releaseYear: true,
                        authors: true,
                    },
                },
            },
        }),
    ]);

    const excludedBookIds = new Set<string>([
        ...similarityResult.userReviews.map((review) => review.mediaId),
        ...userWishlist.flatMap((item) => (item.bookId ? [item.bookId] : [])),
    ]);
    const userTasteProfile = buildBookTasteProfile(
        reviewedBooks.flatMap((review) =>
            review.bookId && review.book
                ? [
                      {
                          bookId: review.bookId,
                          rating: review.rating,
                          book: review.book,
                      },
                  ]
                : [],
        ),
    );
    const similarUsersById = new Map(
        similarUsers.map((user) => [user.userId, user]),
    );

    const candidateReviews = await prisma.review.findMany({
        where: {
            userId: {
                in: similarUsers.map((user) => user.userId),
            },
            rating: {
                gte: FAVORITE_RATING_THRESHOLD,
            },
            bookId: {
                notIn: [...excludedBookIds],
            },
            mediaType: "BOOK",
        },
        select: {
            bookId: true,
            rating: true,
            userId: true,
        },
    });

    const bookScoresByBookId = new Map<
        string,
        {
            weightedRatingTotal: number;
            similarityTotal: number;
            recommendedByUserIds: Set<string>;
        }
    >();

    for (const review of candidateReviews) {
        const similarUser = similarUsersById.get(review.userId);
        if (!similarUser || !review.bookId) continue;

        const scoreData = bookScoresByBookId.get(review.bookId) ?? {
            weightedRatingTotal: 0,
            similarityTotal: 0,
            recommendedByUserIds: new Set<string>(),
        };

        scoreData.weightedRatingTotal +=
            similarUser.similarityScore * review.rating;
        scoreData.similarityTotal += similarUser.similarityScore;
        scoreData.recommendedByUserIds.add(review.userId);
        bookScoresByBookId.set(review.bookId, scoreData);
    }

    const collaborativeScoresByBookId = new Map(
        [...bookScoresByBookId.entries()].map(([bookId, scoreData]) => [
            bookId,
            {
                score:
                    scoreData.similarityTotal > 0
                        ? scoreData.weightedRatingTotal /
                          scoreData.similarityTotal
                        : NEUTRAL_SCORE,
                recommendedByCount: scoreData.recommendedByUserIds.size,
            },
        ]),
    );

    const candidateBooks = await prisma.book.findMany({
        where: {
            id: {
                notIn: [...excludedBookIds],
            },
        },
        select: {
            id: true,
            title: true,
            releaseYear: true,
            genres: true,
            keywords: true,
            avgRating: true,
            numRatings: true,
            image: true,
            authors: true,
        },
    });

    const scoredBooks = candidateBooks
        .map((book) => {
            const collaborativeScoreData = collaborativeScoresByBookId.get(
                book.id,
            );
            const contentSignals = getContentSignals(book, userTasteProfile);
            const collaborativeScore = contentSignals.hasSpecificAffinity
                ? (collaborativeScoreData?.score ?? NEUTRAL_SCORE)
                : NEUTRAL_SCORE;
            const score =
                contentSignals.score * SCORE_WEIGHTS.content +
                collaborativeScore * SCORE_WEIGHTS.collaborative +
                getPublicQualityScore(book) * SCORE_WEIGHTS.publicQuality +
                getPublicConfidenceScore(book) *
                    SCORE_WEIGHTS.publicConfidence;

            return {
                bookId: book.id,
                book,
                score,
                recommendedByCount:
                    collaborativeScoreData?.recommendedByCount ?? 0,
            };
        })
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.recommendedByCount - a.recommendedByCount;
        })
        .slice(0, RECOMMENDATION_LIMITS.maxBookRecommendations);
    const recommendations: BookRecommendation[] = scoredBooks.map(
        (scoredBook) => ({
            book: toBookResponse(scoredBook.book),
            score: scoredBook.score,
            recommendedByCount: scoredBook.recommendedByCount,
        }),
    );

    return {
        recommendations,
        currentReviewCount: similarityResult.currentReviewCount,
        minReviewsRequired: similarityResult.minReviewsRequired,
        recommendationsAvailable: true,
    };
};

export const getBookRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<BookRecommendationsResult> => {
    const cachedRecommendations = await getCachedBookRecommendationsForUser(
        prisma,
        userId,
    );

    if (cachedRecommendations) return cachedRecommendations;

    const recommendations = await computeBookRecommendationsForUser(
        prisma,
        userId,
    );

    try {
        await replaceBookRecommendationsForUser(
            prisma,
            userId,
            recommendations.recommendations,
        );
    } catch (error) {
        console.warn("Could not cache book recommendations", error);
    }

    return recommendations;
};
