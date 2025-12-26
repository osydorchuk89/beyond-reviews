export interface AuthData {
    isAuthenticated: boolean;
    user: User | undefined;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    photo: string;
    likes: { movieId: string }[];
    watchList: { movieId: string }[];
    receivedFriendRequests: {
        id: string;
        sentUserId: string;
        receivedUserId: string;
        sentUser: { firstName: string; lastName: string; photo: string };
    }[];
    sentFriendRequests: {
        id: string;
        sentUserId: string;
        receivedUserId: string;
        receivedUser: { firstName: string; lastName: string; photo: string };
    }[];
    friends: {
        id: string;
        firstName: string;
        lastName: string;
        photo: string;
    }[];
}

export interface Movie {
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
}

export interface MovieData {
    movie: Movie;
    movieReviews: MovieReview[];
}

export interface MoviesData {
    movies: Movie[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    appliedFilters: {
        genre?: string;
        releaseYear?: string;
        director?: string;
        sortBy?: string;
        sortOrder?: string;
        search?: string;
    };
}

export interface MovieReview {
    id: string;
    movieId: string;
    movie: Movie;
    userId: string;
    user: { id: string; firstName: string; lastName: string };
    date: Date;
    rating: number;
    text?: string;
    likedBy: { userId: string }[];
}

export interface UserActivity {
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
}

export interface FriendRequest {
    sentUserId: string;
    receivedUserId: string;
}

export interface ReceivedFriendRequest extends FriendRequest {
    sentUser: {
        firstName: string;
        lastName: string;
        photo: string;
    };
}

export interface SentFriendRequest extends FriendRequest {
    receivedUser: {
        firstName: string;
        lastName: string;
        photo: string;
    };
}

export interface MovieWatchList {
    id: string;
    movie: Movie;
    movieId: string;
    userId: string;
}

export interface Message {
    id: string;
    senderId: string;
    sender: User;
    recipientId: string;
    recipient: User;
    text: string;
    date: Date | string;
    wasRead: boolean;
    dateSeparator?: string;
}

export interface UsersMessages {
    senderId: string;
    recipientId: string;
    messages: Message[];
}

export interface Friend {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
}

export interface RegistrationInputs {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photo?: File[];
}

export interface LoginInputs {
    email: string;
    password: string;
}

export interface MovieReviewInputs {
    rating: number;
    text?: string;
}

export interface LocationState {
    from?: string;
}

export interface SearchItem {
    type: string;
    value: string;
    text: string;
    sortOrder?: string;
}
