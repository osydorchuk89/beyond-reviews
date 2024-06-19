export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photo: string;
    watchList: string[];
    ratings: string[];
    friends: User[] | string[];
    friendRequests: User[] | string[];
    __v: number;
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
    movieId: string | Movie;
    movieRating: number;
    movieReview: string;
    userId: string | User;
    date: Date;
    likedBy: string[] | User[];
    __v: number;
    _id: string;
}

export interface Activity {
    userId: User;
    movieId: Movie;
    ratingId: MovieRating;
    otherUserId: User;
    action: string;
    rating: string;
    review: string;
    date: Date;
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
