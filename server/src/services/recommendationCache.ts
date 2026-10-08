import type { MediaType, Prisma, PrismaClient } from "@prisma/client";

import {
    RECOMMENDATION_CACHE_TTL_MS,
    isFresh,
} from "./recommendationScoring.js";

export type RecommendationPrismaClient =
    | PrismaClient
    | Prisma.TransactionClient;

interface RecommendationCacheRow {
    movieId?: string;
    bookId?: string;
    score: number;
    recommendedByCount: number;
}

export const isRecommendationCacheFresh = (generatedAt: Date) =>
    isFresh(generatedAt, RECOMMENDATION_CACHE_TTL_MS);

export const invalidateRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
    mediaType: MediaType,
) => {
    await prisma.recommendationCache.deleteMany({
        where: { userId, mediaType },
    });
};

export const replaceRecommendationsForUser = async (
    prisma: RecommendationPrismaClient,
    userId: string,
    mediaType: MediaType,
    rows: RecommendationCacheRow[],
) => {
    await invalidateRecommendationsForUser(prisma, userId, mediaType);

    if (rows.length === 0) return;

    const generatedAt = new Date();

    await prisma.recommendationCache.createMany({
        data: rows.map((row) => ({
            userId,
            mediaType,
            ...row,
            generatedAt,
        })),
    });
};
