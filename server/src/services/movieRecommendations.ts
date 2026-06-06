import { PrismaClient } from "@prisma/client";

import {
    MovieRecommendation,
    MovieRecommendationsResult,
} from "../lib/entities";
import {
    FAVORITE_RATING_THRESHOLD,
    getSimilarUsersForUser,
} from "./userSimilarity";

const MAX_SIMILAR_USERS_FOR_MOVIE_RECOMMENDATIONS = 30;
const MAX_MOVIE_RECOMMENDATIONS = 12;

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
        MAX_SIMILAR_USERS_FOR_MOVIE_RECOMMENDATIONS,
    );

    if (similarUsers.length === 0) {
        return {
            recommendations: [],
            currentReviewCount: similarityResult.currentReviewCount,
            minReviewsRequired: similarityResult.minReviewsRequired,
            recommendationsAvailable: true,
        };
    }

    const userWatchlist = await prisma.movieWatchList.findMany({
        where: { userId },
        select: {
            movieId: true,
        },
    });

    const excludedMovieIds = new Set([
        ...similarityResult.userReviews.map((review) => review.movieId),
        ...userWatchlist.map((item) => item.movieId),
    ]);
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

    const scoredMovies = [...movieScoresByMovieId.entries()]
        .map(([movieId, scoreData]) => ({
            movieId,
            score: scoreData.weightedRatingTotal / scoreData.similarityTotal,
            recommendedByCount: scoreData.recommendedByUserIds.size,
        }))
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return b.recommendedByCount - a.recommendedByCount;
        })
        .slice(0, MAX_MOVIE_RECOMMENDATIONS);

    const movies = await prisma.movie.findMany({
        where: {
            id: {
                in: scoredMovies.map((movie) => movie.movieId),
            },
        },
        select: {
            id: true,
            title: true,
            releaseYear: true,
            genres: true,
            avgRating: true,
            numRatings: true,
            poster: true,
        },
    });

    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));
    const recommendations = scoredMovies
        .map((scoredMovie) => {
            const movie = moviesById.get(scoredMovie.movieId);
            if (!movie) return null;

            return {
                movie,
                score: scoredMovie.score,
                recommendedByCount: scoredMovie.recommendedByCount,
            };
        })
        .filter(
            (recommendation): recommendation is MovieRecommendation =>
                recommendation !== null,
        );

    return {
        recommendations,
        currentReviewCount: similarityResult.currentReviewCount,
        minReviewsRequired: similarityResult.minReviewsRequired,
        recommendationsAvailable: true,
    };
};
