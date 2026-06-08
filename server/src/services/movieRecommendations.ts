import { PrismaClient } from "@prisma/client";

import {
    CandidateMovie,
    MovieRecommendation,
    MovieRecommendationsResult,
    PreferenceStats,
    ReviewedMovieForProfile,
    UserTasteProfile,
} from "../lib/entities";
import {
    FAVORITE_RATING_THRESHOLD,
    getSimilarUsersForUser,
} from "./userSimilarity";

const RECOMMENDATION_LIMITS = {
    maxSimilarUsers: 30,
    maxMovieRecommendations: 12,
};

const SCORE_WEIGHTS = {
    content: 0.65,
    collaborative: 0.15,
    publicQuality: 0.1,
    publicConfidence: 0.1,
};

const CONTENT_WEIGHTS = {
    genre: 0.4,
    director: 0.25,
    actor: 0.15,
    keyword: 0.15,
    decade: 0.05,
};

const CONFIDENCE_COUNTS = {
    genre: 12,
    director: 2,
    actor: 3,
    keyword: 4,
    decade: 25,
    publicQualityRatings: 50,
    publicRankingRatings: 50,
};

const NEUTRAL_SCORE = 5;
const MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL = 4;
const MIN_SPECIFIC_AFFINITY = 0.08;

const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

const getDecade = (releaseYear: number) => Math.floor(releaseYear / 10) * 10;

const normalizeDirector = (director: string) => director.trim().toLowerCase();

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

const buildUserTasteProfile = (
    reviewedMovies: ReviewedMovieForProfile[],
): UserTasteProfile => {
    const averageRating =
        reviewedMovies.length > 0
            ? reviewedMovies.reduce((sum, review) => sum + review.rating, 0) /
              reviewedMovies.length
            : NEUTRAL_SCORE;
    const profile: UserTasteProfile = {
        genres: new Map(),
        directors: new Map(),
        actors: new Map(),
        keywords: new Map(),
        decades: new Map(),
        averageRating,
    };

    for (const review of reviewedMovies) {
        const preference = clamp(
            (review.rating - averageRating) /
                MAX_RATING_RESIDUAL_FOR_FULL_SIGNAL,
            -1,
            1,
        );
        if (preference === 0) continue;

        for (const genre of review.movie.genres) {
            addPreference(profile.genres, genre, preference);
        }
        for (const actor of review.movie.cast) {
            addPreference(
                profile.actors,
                normalizeProfileTerm(actor),
                preference,
            );
        }
        for (const keyword of review.movie.keywords) {
            addPreference(
                profile.keywords,
                normalizeProfileTerm(keyword),
                preference,
            );
        }

        addPreference(
            profile.directors,
            normalizeDirector(review.movie.director),
            preference,
        );
        addPreference(
            profile.decades,
            getDecade(review.movie.releaseYear),
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

const getContentSignals = (
    movie: CandidateMovie,
    profile: UserTasteProfile,
) => {
    const genrePreference =
        movie.genres.length === 0
            ? 0
            : movie.genres.reduce(
                  (sum, genre) =>
                      sum +
                      getAveragePreference(
                          profile.genres,
                          genre,
                          CONFIDENCE_COUNTS.genre,
                      ),
                  0,
              ) / movie.genres.length;
    const directorPreference = getAveragePreference(
        profile.directors,
        normalizeDirector(movie.director),
        CONFIDENCE_COUNTS.director,
    );
    const actorPreference = getAverageArrayPreference(
        profile.actors,
        movie.cast,
        CONFIDENCE_COUNTS.actor,
    );
    const keywordPreference = getAverageArrayPreference(
        profile.keywords,
        movie.keywords,
        CONFIDENCE_COUNTS.keyword,
    );
    const decadePreference = getAveragePreference(
        profile.decades,
        getDecade(movie.releaseYear),
        CONFIDENCE_COUNTS.decade,
    );
    const hasSpecificAffinity =
        genrePreference >= MIN_SPECIFIC_AFFINITY ||
        directorPreference >= MIN_SPECIFIC_AFFINITY ||
        actorPreference >= MIN_SPECIFIC_AFFINITY ||
        keywordPreference >= MIN_SPECIFIC_AFFINITY;
    const effectiveDecadePreference = hasSpecificAffinity
        ? decadePreference
        : Math.min(decadePreference, 0);

    return {
        score:
            preferenceToScore(genrePreference) * CONTENT_WEIGHTS.genre +
            preferenceToScore(directorPreference) * CONTENT_WEIGHTS.director +
            preferenceToScore(actorPreference) * CONTENT_WEIGHTS.actor +
            preferenceToScore(keywordPreference) * CONTENT_WEIGHTS.keyword +
            preferenceToScore(effectiveDecadePreference) *
                CONTENT_WEIGHTS.decade,
        hasSpecificAffinity,
    };
};

const getPublicQualityScore = (movie: CandidateMovie) => {
    const confidence = clamp(
        movie.numRatings / CONFIDENCE_COUNTS.publicQualityRatings,
        0,
        1,
    );

    return movie.avgRating * confidence + NEUTRAL_SCORE * (1 - confidence);
};

const getPublicConfidenceScore = (movie: CandidateMovie) => {
    const confidence = clamp(
        Math.sqrt(movie.numRatings / CONFIDENCE_COUNTS.publicRankingRatings),
        0,
        1,
    );

    return NEUTRAL_SCORE + confidence * NEUTRAL_SCORE;
};

export const getMovieRecommendationsForUser = async (
    prisma: PrismaClient,
    userId: string,
): Promise<MovieRecommendationsResult> => {
    const similarityResult = await getSimilarUsersForUser(prisma, userId);

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

    const [userWatchlist, reviewedMovies] = await Promise.all([
        prisma.movieWatchList.findMany({
            where: { userId },
            select: {
                movieId: true,
            },
        }),
        prisma.movieReview.findMany({
            where: { userId },
            select: {
                movieId: true,
                rating: true,
                movie: {
                    select: {
                        genres: true,
                        cast: true,
                        keywords: true,
                        director: true,
                        releaseYear: true,
                    },
                },
            },
        }),
    ]);

    const excludedMovieIds = new Set([
        ...similarityResult.userReviews.map((review) => review.movieId),
        ...userWatchlist.map((item) => item.movieId),
    ]);
    const userTasteProfile = buildUserTasteProfile(reviewedMovies);
    const similarUsersById = new Map(
        similarUsers.map((user) => [user.userId, user]),
    );

    const candidateReviews = await prisma.movieReview.findMany({
        where: {
            userId: {
                in: similarUsers.map((user) => user.userId),
            },
            rating: {
                gte: FAVORITE_RATING_THRESHOLD,
            },
            movieId: {
                notIn: [...excludedMovieIds],
            },
        },
        select: {
            movieId: true,
            rating: true,
            userId: true,
        },
    });

    const movieScoresByMovieId = new Map<
        string,
        {
            weightedRatingTotal: number;
            similarityTotal: number;
            recommendedByUserIds: Set<string>;
        }
    >();

    for (const review of candidateReviews) {
        const similarUser = similarUsersById.get(review.userId);
        if (!similarUser) continue;

        const scoreData = movieScoresByMovieId.get(review.movieId) ?? {
            weightedRatingTotal: 0,
            similarityTotal: 0,
            recommendedByUserIds: new Set<string>(),
        };

        scoreData.weightedRatingTotal +=
            similarUser.similarityScore * review.rating;
        scoreData.similarityTotal += similarUser.similarityScore;
        scoreData.recommendedByUserIds.add(review.userId);
        movieScoresByMovieId.set(review.movieId, scoreData);
    }

    const collaborativeScoresByMovieId = new Map(
        [...movieScoresByMovieId.entries()].map(([movieId, scoreData]) => [
            movieId,
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

    const candidateMovies = await prisma.movie.findMany({
        where: {
            id: {
                notIn: [...excludedMovieIds],
            },
        },
        select: {
            id: true,
            title: true,
            releaseYear: true,
            director: true,
            genres: true,
            cast: true,
            keywords: true,
            avgRating: true,
            numRatings: true,
            poster: true,
        },
    });

    const scoredMovies = candidateMovies
        .map((movie) => {
            const collaborativeScoreData = collaborativeScoresByMovieId.get(
                movie.id,
            );
            const contentSignals = getContentSignals(movie, userTasteProfile);
            const collaborativeScore = contentSignals.hasSpecificAffinity
                ? (collaborativeScoreData?.score ?? NEUTRAL_SCORE)
                : NEUTRAL_SCORE;
            const score =
                contentSignals.score * SCORE_WEIGHTS.content +
                collaborativeScore * SCORE_WEIGHTS.collaborative +
                getPublicQualityScore(movie) * SCORE_WEIGHTS.publicQuality +
                getPublicConfidenceScore(movie) *
                    SCORE_WEIGHTS.publicConfidence;

            return {
                movieId: movie.id,
                movie,
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
        .slice(0, RECOMMENDATION_LIMITS.maxMovieRecommendations);
    const recommendations: MovieRecommendation[] = scoredMovies.map(
        (scoredMovie) => {
            const { director: _director, ...movie } = scoredMovie.movie;

            return {
                movie,
                score: scoredMovie.score,
                recommendedByCount: scoredMovie.recommendedByCount,
            };
        },
    );

    return {
        recommendations,
        currentReviewCount: similarityResult.currentReviewCount,
        minReviewsRequired: similarityResult.minReviewsRequired,
        recommendationsAvailable: true,
    };
};
