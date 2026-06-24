import { LoaderFunctionArgs, redirect } from "react-router";

import {
    getAuthData,
    getBook,
    getBookReviews,
    getBooks,
    getFriendRecommendations,
    getMovie,
    getMovieRecommendations,
    getMovieReviews,
    getMovies,
    getUser,
    getUserActivities,
    getUserMovieReviews,
    getWishlist,
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
    const actor = searchParams.get("actor") ?? undefined;
    const sortBy = searchParams.get("sortBy") ?? undefined;
    const sortOrder = searchParams.get("sortOrder") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const moviesDataPromise = getMovies(
        page,
        15,
        genre,
        releaseYear,
        director,
        actor,
        sortBy,
        sortOrder,
        search,
    );
    const movieRecommendationsDataPromise = getAuthData()
        .then((authData) =>
            authData.user ? getMovieRecommendations(authData.user.id) : null,
        )
        .catch(() => null);

    return { moviesDataPromise, movieRecommendationsDataPromise };
};

export const movieLoader = async ({ params }: LoaderFunctionArgs) => {
    const { movieId } = params as { movieId: string };

    const authDataPromise = getAuthData();
    const moviePromise = getMovie(movieId);

    const authData = await authDataPromise;
    const movieReviewsDataPromise = getMovieReviews(
        movieId,
        1,
        10,
        authData.user?.id,
    );

    const [movie, movieReviewsData] = await Promise.all([
        moviePromise,
        movieReviewsDataPromise,
    ]);
    return { movie, movieReviewsData };
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

export const userFriendsLoader = async (args: LoaderFunctionArgs) => {
    const protectedResult = await protectedLoader(args);

    if (protectedResult) {
        return protectedResult;
    }

    const { userId } = args.params as { userId: string };

    const friendRecommendationsResultPromise = getFriendRecommendations(userId)
        .then((friendRecommendationsData) => ({
            friendRecommendationsData,
            friendRecommendationsError: false,
        }))
        .catch(() => ({
            friendRecommendationsData: null,
            friendRecommendationsError: true,
        }));

    return { friendRecommendationsResultPromise };
};

export const bookLoader = async ({ params }: LoaderFunctionArgs) => {
    const { bookId } = params as { bookId: string };

    const authDataPromise = getAuthData();
    const authData = await authDataPromise;
    const bookPromise = getBook(bookId, authData.user?.id);
    const bookReviewsDataPromise = getBookReviews(
        bookId,
        1,
        10,
        authData.user?.id,
    );

    const [book, bookReviewsData] = await Promise.all([
        bookPromise,
        bookReviewsDataPromise,
    ]);
    return { book, bookReviewsData };
};

export const booksLoader = ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const page = parseInt(searchParams.get("page") ?? "1");
    const genre = searchParams.get("genre") ?? undefined;
    const releaseYear = searchParams.get("releaseYear") ?? undefined;
    const author = searchParams.get("author") ?? undefined;
    const sortBy = searchParams.get("sortBy") ?? undefined;
    const sortOrder = searchParams.get("sortOrder") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    const booksDataPromise = getBooks(
        page,
        15,
        genre,
        releaseYear,
        author,
        sortBy,
        sortOrder,
        search,
    );

    return { booksDataPromise };
};

export const userWishlistLoader = async ({ params }: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const [authData, wishlistData] = await Promise.all([
        getAuthData(),
        getWishlist(userId),
    ]);

    if (!authData.isAuthenticated || authData.user?.id !== userId) {
        return {
            wishlistData,
            movieRecommendationsDataPromise: null,
        };
    }

    const movieRecommendationsDataPromise = getMovieRecommendations(userId)
        .catch(() => null);

    return {
        wishlistData,
        movieRecommendationsDataPromise,
    };
};

export const userReviewsLoader = async ({
    params,
    request,
}: LoaderFunctionArgs) => {
    const { userId } = params as { userId: string };
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const userMovieReviews = await getUserMovieReviews(userId, page);
    return { userMovieReviews };
};

export const loginLoader = async () => {
    const authData = await getAuthData();
    if (authData.isAuthenticated) {
        return redirect("/");
    }
    return null;
};
