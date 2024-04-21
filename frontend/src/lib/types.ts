export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    __v: number;
}

export interface Message {
    _id: string;
    sender: User;
    recipient: User;
    text: string;
    date: Date;
}

export interface MovieRating {
    movieId: string;
    movieRating: number;
    movieReview: string;
    userId: string | User;
    date: Date;
    likedBy: string[] | User[];
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
    likedBy: string[] | User[];
}

export interface AuthStatus {
    isAuthenticated: boolean;
    userData: User | null;
}
