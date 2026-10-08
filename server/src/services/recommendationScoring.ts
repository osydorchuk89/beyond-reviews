import type { PreferenceStats } from "../lib/entities.js";

export const RECOMMENDATION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const SCORE_WEIGHTS = {
    content: 0.65,
    collaborative: 0.15,
    publicQuality: 0.1,
    publicConfidence: 0.1,
};

export const NEUTRAL_SCORE = 5;
export const MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL = 4;
export const MIN_SPECIFIC_AFFINITY = 0.08;

interface PubliclyRatedCandidate {
    avgRating: number;
    numRatings: number;
}

export interface CollaborativeReview {
    mediaId: string | null;
    rating: number;
    userId: string;
}

export interface SimilarityWeightedUser {
    userId: string;
    similarityScore: number;
}

export interface CollaborativeScore {
    score: number;
    recommendedByCount: number;
}

export const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

export const getDecade = (releaseYear: number) =>
    Math.floor(releaseYear / 10) * 10;

export const normalizeProfileTerm = (term: string) => term.trim().toLowerCase();

export const addPreference = <T>(
    preferences: Map<T, PreferenceStats>,
    key: T,
    preference: number,
) => {
    const stats = preferences.get(key) ?? { total: 0, count: 0 };
    stats.total += preference;
    stats.count += 1;
    preferences.set(key, stats);
};

export const getAveragePreference = <T>(
    preferences: Map<T, PreferenceStats>,
    key: T,
    confidenceCount: number,
) => {
    const stats = preferences.get(key);
    if (!stats) return 0;

    const confidence = clamp(stats.count / confidenceCount, 0, 1);
    return clamp((stats.total / stats.count) * confidence, -1, 1);
};

export const preferenceToScore = (preference: number) =>
    clamp((preference + 1) * 5, 0, 10);

export const getAverageArrayPreference = (
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

export const getPublicQualityScore = (
    candidate: PubliclyRatedCandidate,
    confidenceCount: number,
) => {
    const confidence = clamp(candidate.numRatings / confidenceCount, 0, 1);

    return candidate.avgRating * confidence + NEUTRAL_SCORE * (1 - confidence);
};

export const getPublicConfidenceScore = (
    candidate: PubliclyRatedCandidate,
    confidenceCount: number,
) => {
    const confidence = clamp(
        Math.sqrt(candidate.numRatings / confidenceCount),
        0,
        1,
    );

    return NEUTRAL_SCORE + confidence * NEUTRAL_SCORE;
};

export const isFresh = (generatedAt: Date, ttlMs: number) =>
    Date.now() - generatedAt.getTime() < ttlMs;

export const buildCollaborativeScores = (
    candidateReviews: CollaborativeReview[],
    similarUsers: SimilarityWeightedUser[],
) => {
    const similarUsersById = new Map(
        similarUsers.map((user) => [user.userId, user]),
    );
    const weightedScoresByMediaId = new Map<
        string,
        {
            weightedRatingTotal: number;
            similarityTotal: number;
            recommendedByUserIds: Set<string>;
        }
    >();

    for (const review of candidateReviews) {
        const similarUser = similarUsersById.get(review.userId);
        if (!similarUser || !review.mediaId) continue;

        const scoreData = weightedScoresByMediaId.get(review.mediaId) ?? {
            weightedRatingTotal: 0,
            similarityTotal: 0,
            recommendedByUserIds: new Set<string>(),
        };

        scoreData.weightedRatingTotal +=
            similarUser.similarityScore * review.rating;
        scoreData.similarityTotal += similarUser.similarityScore;
        scoreData.recommendedByUserIds.add(review.userId);
        weightedScoresByMediaId.set(review.mediaId, scoreData);
    }

    return new Map(
        [...weightedScoresByMediaId.entries()].map(([mediaId, scoreData]) => [
            mediaId,
            {
                score:
                    scoreData.similarityTotal > 0
                        ? scoreData.weightedRatingTotal /
                          scoreData.similarityTotal
                        : NEUTRAL_SCORE,
                recommendedByCount: scoreData.recommendedByUserIds.size,
            },
        ]),
    ) as Map<string, CollaborativeScore>;
};
