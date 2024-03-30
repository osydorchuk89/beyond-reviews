import axios from "axios";
import { AuthState, store } from "../store";
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

export const getMovie = async (movieId: string) => {
    const userId = store.getState().auth.userData?._id;
    try {
        const response = await axios({
            method: "get",
            url: `${BASE_API_URL}movies/${movieId}`,
        });
        if (userId) {
        }
        return response.data;
    } catch (error) {
        console.log(error);
    }
};
