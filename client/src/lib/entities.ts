export type AuthData = {
    isAuthenticated: boolean;
    user: User;
};

export type User = {
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

export type MoviesData = {
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
};

export type MovieReview = {
    id: string;
    movieId: string;
    movie: Movie;
    userId: string;
    user: { id: string; firstName: string; lastName: string };
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

export type MovieWatchList = {
    id: string;
    movie: Movie;
    movieId: string;
    userId: string;
};

export type Message = {
    id: string;
    senderId: string;
    sender: User;
    recipientId: string;
    recipient: User;
    text: string;
    date: Date | string;
    wasRead: boolean;
    dateSeparator?: string;
};

export type UsersMessages = {
    senderId: string;
    recipientId: string;
    messages: Message[];
};

export type Friend = {
    id: string;
    firstName: string;
    lastName: string;
    photo: string;
};
