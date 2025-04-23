export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    photoUrl: string;
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
};

export type MovieReview = {
    id: string;
    movieId: string | Movie;
    userId: string;
    user: { firstName: string; lastName: string };
    date: Date;
    rating: number;
    text?: string;
    likedBy: { userId: string }[];
};
