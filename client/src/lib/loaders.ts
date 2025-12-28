import { LoaderFunctionArgs, redirect } from "react-router";

import {
    getAuthData,
    getMovie,
    getMovieReviews,
    getMovies,
    getUser,
    getUserActivities,
    getUserMovieReviews,
    getWatchList,
} from "./api";

export const rootLoader = async () => {
    const authData = await getAuthData();
    return { authData };
};

export const moviesLoader = ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const page = parseInt(searchParams.get("page") ?? "1");
    const genre = searchParams.get("genre") ?? undefined;
    const releaseYear = searchParams.get("releaseYear") ?? undefined;
    const director = searchParams.get("director") ?? undefined;
    const sortBy = searchParams.get("sortBy") ?? undefined;
    const sortOrder = searchParams.get("sortOrder") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const moviesDataPromise = getMovies(
        page,
        15,
        genre,
        releaseYear,
        director,
        sortBy,
        sortOrder,
        search
    );
    return { moviesDataPromise };
};

export const movieLoader = async ({ params }: LoaderFunctionArgs) => {
    const { movieId } = params as { movieId: string };
    const [movie, movieReviews] = await Promise.all([
        getMovie(movieId),
        getMovieReviews(movieId),
    ]);
    return { movie, movieReviews };
};

export const userProfileLoader = async ({ params }: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const user = await getUser(userId);
    return { user };
};

export const userActivitiesLoader = async ({
    params,
    request,
}: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const userActivities = await getUserActivities(userId, page);
    return { userActivities };
};

export const protectedLoader = async ({ params }: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const authData = await getAuthData();
    if (!authData.isAuthenticated || authData.user?.id !== userId) {
        return redirect("/");
    }
    return null;
};

export const userWatchListLoader = async ({ params }: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const userWatchList = await getWatchList(userId);
    return { userWatchList };
};

export const userReviewsLoader = async ({ params }: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const userMovieReviews = await getUserMovieReviews(userId);
    return { userMovieReviews };
};

export const loginLoader = async () => {
    const authData = await getAuthData();
    if (authData.isAuthenticated) {
        return redirect("/");
    }
    return null;
};
