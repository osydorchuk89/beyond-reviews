import axios from "axios";

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
