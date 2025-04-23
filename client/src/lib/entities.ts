export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    photo: string;
    likes: { movieId: string }[];
    watchList: { movieId: string }[];
};

export type Movie = {
    id: string;
    title: string;
    releaseYear: number;
    director: string;
    overview: string;
    language: string;
    genres: string[];
    runtime: number;
    avgRating: number;
    numRatings: number;
    reviews: MovieReview[];
    poster: string;
    onWatchList: { userId: string }[];
};

export type MovieReview = {
    id: string;
    movieId: string;
    movie: Movie;
    userId: string;
    user: { firstName: string; lastName: string };
    date: Date;
    rating: number;
    text?: string;
    likedBy: { userId: string }[];
};

export type UserActivity = {
    id: string;
    userId: string;
    user: User;
    movieId: string;
    movie: Movie;
    movieReviewId: string;
    movieReview: MovieReview;
    action: string;
    reviewRating: string;
    reviewText: string;
    date: Date;
};
