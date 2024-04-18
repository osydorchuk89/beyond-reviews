import axios from "axios";
import { AuthState } from "../store";
import { BASE_API_URL } from "./urls";
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export const getUserRating = async (authData: AuthState, movieId: string) => {
    if (authData.userData) {
        try {
            const response = await axios({
                method: "get",
                url: BASE_API_URL + "movies/" + movieId + "/ratings",
                withCredentials: true,
                params: {
                    userId: authData.userData._id,
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
        return response.data;
    } catch (error) {
        console.log(error);
    }
};
