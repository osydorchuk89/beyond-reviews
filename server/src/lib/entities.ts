export interface Rating {
    movieId: string;
    rating: number;
}

export interface CandidateRating extends Rating {
    userId: string;
}

export interface FriendRecommendation {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        photo: string | null;
    };
    similarityScore: number;
    sharedMovieCount: number;
    sharedFavoriteTitles: string[];
}

export interface FriendRecommendationsResult {
    recommendations: FriendRecommendation[];
    currentReviewCount: number;
    minReviewsRequired: number;
    recommendationsAvailable: boolean;
}

export interface MovieRecommendation {
    movie: {
        id: string;
        title: string;
        releaseYear: number;
        genres: string[];
        cast: string[];
        keywords: string[];
        avgRating: number;
        numRatings: number;
        poster: string;
    };
    score: number;
    recommendedByCount: number;
}

export interface MovieRecommendationsResult {
    recommendations: MovieRecommendation[];
    currentReviewCount: number;
    minReviewsRequired: number;
    recommendationsAvailable: boolean;
}

export interface ReviewedMovieForProfile {
    movieId: string;
    rating: number;
    movie: {
        genres: string[];
        cast: string[];
        keywords: string[];
        director: string | null;
        releaseYear: number;
    };
}

export interface CandidateMovie {
    id: string;
    title: string;
    releaseYear: number;
    director: string | null;
    genres: string[];
    cast: string[];
    keywords: string[];
    avgRating: number;
    numRatings: number;
    image: string;
}

export interface PreferenceStats {
    total: number;
    count: number;
}

export interface UserTasteProfile {
    genres: Map<string, PreferenceStats>;
    directors: Map<string, PreferenceStats>;
    actors: Map<string, PreferenceStats>;
    keywords: Map<string, PreferenceStats>;
    decades: Map<number, PreferenceStats>;
    averageRating: number;
}
