import axios from "axios";
import { Message, UsersMessages } from "./entities";

export const BASE_URL = "http://localhost:3000";

export const sendRegistrationData = async (userData: FormData) => {
    try {
        await axios({
            method: "post",
            url: BASE_URL + "/api/users/",
            headers: {
                "Content-Type": "multi-part/formdata",
            },
            data: userData,
        });
    } catch (error) {
        console.log(error);
    }
};

export const sendLoginData = async (loginData: {
    email: string;
    password: string;
}) => {
    try {
        const response = await axios({
            method: "post",
            url: BASE_URL + "/auth/login",
            withCredentials: true,
            data: loginData,
        });
        return response;
    } catch (error: any) {
        return error;
    }
};

export const getAuthData = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + "/auth/status",
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const logout = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + "/auth/logout",
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getMovies = async () => {
    try {
        const moviesResult = await axios.get(BASE_URL + "/api/movies/");
        return moviesResult.data;
    } catch (error) {
        console.log(error);
    }
};

export const getMovie = async (movieId: string) => {
    try {
        const movieResult = await axios.get(
            BASE_URL + `/api/movies/${movieId}`
        );
        return movieResult.data;
    } catch (error) {
        console.log(error);
    }
};

export const getMovieReviews = async (movieId: string) => {
    try {
        const movieReviewsResult = await axios.get(
            BASE_URL + `/api/movies/${movieId}/reviews`
        );
        return movieReviewsResult.data;
    } catch (error) {
        console.log(error);
    }
};

export const sendMovieReview = async (
    movieId: string,
    userId: string,
    movieReviewData: any
) => {
    const date = new Date();
    try {
        const response = await axios({
            method: "post",
            url: `${BASE_URL}/api/movies/${movieId}/reviews`,
            withCredentials: true,
            data: { ...movieReviewData, userId: userId, date },
        });
        return response;
    } catch (error: any) {
        return error;
    }
};

export const sendLikeOrUnlike = async (
    movieId: string,
    reviewId: string,
    userId: string,
    hasLiked: boolean
) => {
    try {
        await axios({
            method: "put",
            url: BASE_URL + `/api/movies/${movieId}/reviews/${reviewId}`,
            withCredentials: true,
            data: { like: !hasLiked, userId },
        });
    } catch (error: any) {
        console.log(error);
    }
};

export const sendMovieToOrFromWatchlist = async (
    movieId: string,
    userId: string,
    hasSaved: boolean
) => {
    try {
        await axios({
            method: "put",
            url: BASE_URL + `/api/movies/${movieId}`,
            withCredentials: true,
            data: { saved: hasSaved ? false : true, userId },
        });
    } catch (error: any) {
        console.log(error);
    }
};

export const getUser = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + `/api/users/${userId}`,
            withCredentials: true,
        });
        return response.data;
    } catch (error: any) {
        console.log(error);
    }
};

export const getUserActivities = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + `/api/users/${userId}/activities`,
            withCredentials: true,
        });
        return response.data;
    } catch (error: any) {
        console.log(error);
    }
};

export const getUserFriends = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + `/api/users/${userId}/friends/`,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const sendFriendRequest = async (
    userId: string,
    otherUserId: string
) => {
    try {
        await axios({
            method: "post",
            url: BASE_URL + `/api/users/${userId}/friend-requests/`,
            data: { otherUserId },
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
        await axios({
            method: "post",
            url: BASE_URL + `/api/users/${userId}/friends/`,
            data: { otherUserId },
        });
    } catch (error) {
        console.log(error);
    }
};

export const getWatchList = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + `/api/users/${userId}/watch-list`,
            withCredentials: true,
        });
        return response.data;
    } catch (error: any) {
        console.log(error);
    }
};

export const getChatHistory = async (senderId: string, recipientId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + "/api/messages",
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
    }
};

export const getAllMessages = async (
    users: { senderId: string; recipientId: string }[]
) => {
    const allMessages = [];
    for (const { senderId, recipientId } of users) {
        const messages = await getChatHistory(senderId, recipientId);
        allMessages.push(messages);
    }
    return allMessages;
};

export const sendMessage = async (
    senderId: string,
    recipientId: string,
    text: string
) => {
    const date = new Date();
    try {
        await axios({
            method: "post",
            url: BASE_URL + "/api/messages",
            headers: {
                "Content-Type": "application/json",
            },
            data: {
                senderId,
                recipientId,
                text,
                date,
            },
        });
    } catch (error) {
        console.log(error);
    }
};

export const markMessageAsRead = async (messageId: string) => {
    console.log("here");
    try {
        await axios({
            method: "put",
            url: BASE_URL + `/api/messages/${messageId}`,
        });
    } catch (error) {
        console.log(error);
    }
};
