export interface MovieRating {
    movieId: string;
    movieRating: number;
    movieReview: string;
    userId: string;
    __v: number;
    _id: string;
}

export interface Movie {
    _id: string;
    title: string;
    releaseYear: number;
    director: string;
    overview: string;
    ratings: string[] | MovieRating[];
    avgRating: number;
    numRatings: number;
    genres: string[];
    runtime: number;
    language: string;
    avgVote: number;
    numVotes: number;
    poster: string;
}
