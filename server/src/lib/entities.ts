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