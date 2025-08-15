import { AxiosResponse } from "axios";

import axiosInstance from "./axiosInstance";
import {
    AuthData,
    Message,
    Movie,
    MovieReview,
    MoviesData,
    MovieWatchList,
    User,
    UserActivity,
    UsersMessages,
} from "./entities";

// Registration
export const sendRegistrationData = async (userData: FormData) => {
    try {
        const response = await axiosInstance.post("/api/users/", userData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Authentification
export const sendLoginData = async (loginData: {
    email: string;
    password: string;
}): Promise<AxiosResponse> => {
    try {
        const response = await axiosInstance.post("/auth/login", loginData);
        return response;
    } catch (error: any) {
        return error;
    }
};

export const getAuthData = async (): Promise<AuthData> => {
    try {
        const response = await axiosInstance.get("/auth/status");
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const logout = async (): Promise<AxiosResponse> => {
    try {
        const response = await axiosInstance.get("/auth/logout");
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Movies
export const getMovies = async (
    page: number = 1,
    limit: number = 15,
    genre?: string,
    releaseYear?: string,
    director?: string,
    sortBy?: string,
    sortOrder?: string,
    search?: string
): Promise<MoviesData> => {
    try {
        const params: any = { page, limit };
        if (genre) params.genre = genre;
        if (releaseYear) params.releaseYear = releaseYear;
        if (director) params.director = director;
        if (sortBy) params.sortBy = sortBy;
        if (sortOrder) params.sortOrder = sortOrder;
        if (search) params.search = search;

        const response = await axiosInstance.get("/api/movies", { params });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const getMovie = async (movieId: string): Promise<Movie> => {
    try {
        const response = await axiosInstance.get(`/api/movies/${movieId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Movie reviews
export const getMovieReviews = async (
    movieId: string
): Promise<MovieReview[]> => {
    try {
        const response = await axiosInstance.get(
            `/api/movies/${movieId}/reviews`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const sendMovieReview = async (
    movieId: string,
    userId: string,
    movieReviewData: any
) => {
    const date = new Date();
    try {
        await axiosInstance.post(`/api/movies/${movieId}/reviews`, {
            ...movieReviewData,
            userId: userId,
            date,
        });
    } catch (error) {
        console.log(error);
    }
};

export const getUserMovieReviews = async (
    userId: string
): Promise<MovieReview[]> => {
    try {
        const response = await axiosInstance.get(
            `/api/users/${userId}/movie-reviews`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Review likes
export const sendLikeOrUnlike = async (
    movieId: string,
    reviewId: string,
    userId: string,
    hasLiked: boolean
) => {
    try {
        await axiosInstance.put(`/api/movies/${movieId}/reviews/${reviewId}`, {
            like: !hasLiked,
            userId,
        });
    } catch (error: any) {
        console.log(error);
    }
};

// Watch lists
export const addOrRemoveMovieFromWatchlist = async (
    movieId: string,
    userId: string,
    hasSaved: boolean
) => {
    try {
        await axiosInstance.put(`/api/movies/${movieId}`, {
            saved: !hasSaved,
            userId,
        });
    } catch (error: any) {
        console.log(error);
    }
};

export const getWatchList = async (userId: string): Promise<MovieWatchList> => {
    try {
        const response = await axiosInstance.get(
            `/api/users/${userId}/watch-list`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// Users
export const getUser = async (userId: string): Promise<User> => {
    try {
        const response = await axiosInstance.get(`/api/users/${userId}`);
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

// User activities
export const getUserActivities = async (
    userId: string
): Promise<UserActivity[]> => {
    try {
        const response = await axiosInstance.get(
            `/api/users/${userId}/activities`
        );
        return response.data;
    } catch (error: any) {
        console.log(error);
        throw error;
    }
};

// User friends
export const getUserFriends = async (userId: string): Promise<User[]> => {
    try {
        const response = await axiosInstance.get(
            `/api/users/${userId}/friends/`
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const sendFriendRequest = async (
    userId: string,
    otherUserId: string
) => {
    try {
        await axiosInstance.post(`/api/users/${userId}/friend-requests/`, {
            otherUserId,
        });
    } catch (error) {
        console.log(error);
    }
};

export const acceptFriendRequest = async (
    userId: string,
    otherUserId: string
) => {
    try {
        await axiosInstance.post(`/api/users/${userId}/friends/`, {
            otherUserId,
        });
    } catch (error) {
        console.log(error);
    }
};

// Messages
export const getChatHistory = async (senderId: string, recipientId: string) => {
    try {
        const response = await axiosInstance.get("/api/messages", {
            params: {
                senderId,
                recipientId,
            },
        });
        const messages: Message[] = response.data;
        const parsedMessages: Message[] = messages.map((message) => {
            const messageDate = new Date(message.date);
            const parsedDate = messageDate.toLocaleString("default", {
                month: "short",
                day: "numeric",
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
            });
            return { ...message, date: parsedDate };
        });
        const usersMessages: UsersMessages = {
            senderId,
            recipientId,
            messages: parsedMessages,
        };
        return usersMessages;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const sendMessage = async (
    senderId: string,
    recipientId: string,
    text: string
): Promise<Message> => {
    const date = new Date();
    try {
        const response = await axiosInstance.post(
            "/api/messages",
            {
                senderId,
                recipientId,
                text,
                date,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const markMessageAsRead = async (messageId: string) => {
    try {
        await axiosInstance.put(`/api/messages/${messageId}`);
    } catch (error) {
        console.log(error);
    }
};
