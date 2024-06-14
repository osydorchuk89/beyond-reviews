export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photo: string;
    watchList: string[];
    ratings: string[];
    __v: number;
}

export interface MovieShort {
    _id: string;
    title: string;
    poster: string;
    releaseYear: number;
}

export interface Message {
    _id: string;
    sender: User;
    recipient: User;
    text: string;
    date: Date | string;
    seen: boolean;
    read: boolean;
    dateSeparator?: string;
}

export interface UsersMessages {
    sender: User | string;
    recipient: User | string;
    messages: Message[];
}

export interface MovieRating {
    movieId: string | MovieShort;
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
    onWatchList: string[] | User[];
}

export interface AuthStatus {
    isAuthenticated: boolean;
    userData: User | null;
}
