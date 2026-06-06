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
