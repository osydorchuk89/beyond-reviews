import type { PrismaClient } from "@prisma/client";

import type {
    BookRecommendation,
    BookRecommendationsResult,
    PreferenceStats,
} from "../lib/entities.js";
import { toBookResponse } from "../lib/media.js";
import {
    FAVORITE_RATING_THRESHOLD,
    MIN_REVIEWS_FOR_RECOMMENDATIONS,
    getSimilarBookUsersForUser,
} from "./userSimilarity.js";
import {
    MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL,
    MIN_SPECIFIC_AFFINITY,
    NEUTRAL_SCORE,
    SCORE_WEIGHTS,
    addPreference,
    buildCollaborativeScores,
    clamp,
    getAverageArrayPreference,
    getAveragePreference,
    getDecade,
    getPublicConfidenceScore,
    getPublicQualityScore,
    normalizeProfileTerm,
    preferenceToScore,
} from "./recommendationScoring.js";
import {
    invalidateRecommendationsForUser,
    isRecommendationCacheFresh,
    type RecommendationPrismaClient,
    replaceRecommendationsForUser,
} from "./recommendationCache.js";

const RECOMMENDATION_LIMITS = {
    maxSimilarUsers: 30,
    maxBookRecommendations: 12,
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

export const replaceBookRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
    recommendations: BookRecommendation[],
) => {
    await replaceRecommendationsForUser(
        prisma,
        userId,
        "BOOK",
        recommendations.map((recommendation) => ({
            bookId: recommendation.book.id,
            score: recommendation.score,
            recommendedByCount: recommendation.recommendedByCount,
        })),
    );
};

export const invalidateBookRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
) => {
    await invalidateRecommendationsForUser(prisma, userId, "BOOK");
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
            (recommendation) =>
                !isRecommendationCacheFresh(recommendation.generatedAt),
        )
    ) {
        return null;
    }

    return {
        recommendations: cachedRecommendations
            .filter(
                (
                    recommendation,
                ): recommendation is typeof recommendation & {
                    book: NonNullable<typeof recommendation.book>;
                } => recommendation.book !== null,
            )
            .map((recommendation) => ({
                book: toBookResponse(recommendation.book),
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

    const collaborativeScoresByBookId = buildCollaborativeScores(
        candidateReviews.map((review) => ({
            mediaId: review.bookId,
            rating: review.rating,
            userId: review.userId,
        })),
        similarUsers,
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
                getPublicQualityScore(
                    book,
                    CONFIDENCE_COUNTS.publicQualityRatings,
                ) *
                    SCORE_WEIGHTS.publicQuality +
                getPublicConfidenceScore(
                    book,
                    CONFIDENCE_COUNTS.publicRankingRatings,
                ) *
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
