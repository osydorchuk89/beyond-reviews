import axios from "axios";
import { BASE_API_URL, BASE_URL } from "./urls";
import { QueryClient } from "@tanstack/react-query";
import { AuthStatus, Message, UsersMessages } from "./types";

export const queryClient = new QueryClient();

export const getUserRating = async (movieId: string) => {
    const authStatus = queryClient.getQueryData<AuthStatus>(["authState"]);
    if (authStatus!.userData) {
        try {
            const response = await axios({
                method: "get",
                url: BASE_API_URL + "movies/" + movieId + "/ratings",
                withCredentials: true,
                params: {
                    userId: authStatus!.userData._id,
                },
            });
            if (response.data) {
                return response.data;
            } else {
                return null;
            }
        } catch (error) {
            console.log(error);
        }
    } else {
        return null;
    }
};

export const getMovies = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "movies",
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getMovie = async (movieId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: `${BASE_API_URL}movies/${movieId}`,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getMovieRatings = async (movieId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: `${BASE_API_URL}movies/${movieId}/ratings`,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUser = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "users/" + userId,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUserRatings = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "users/" + userId + "/ratings/",
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUserSavedMovies = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "users/" + userId + "/watchList/",
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUserActivity = async (userId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "users/" + userId + "/activity/",
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const getUsers = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "users",
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
            url: BASE_API_URL + "users/" + userId + "/friend-requests/",
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
            url: BASE_API_URL + "users/" + userId + "/friends/",
            data: { otherUserId },
        });
    } catch (error) {
        console.log(error);
    }
};
export const getMessages = async (senderId: string, recipientId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "messages",
            params: {
                sender: senderId,
                recipient: recipientId,
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
            sender: senderId,
            recipient: recipientId,
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
        const messages = await getMessages(senderId, recipientId);
        allMessages.push(messages);
    }
    return allMessages;
};

export const markMessageRead = async (messageId: string) => {
    try {
        await axios({
            method: "put",
            url: BASE_API_URL + "messages/" + messageId,
        });
    } catch (error) {
        console.log(error);
    }
};

export const getAuthStatus = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_URL + "auth",
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};
