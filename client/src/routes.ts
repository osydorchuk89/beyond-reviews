import { createBrowserRouter, redirect } from "react-router";

import { MainLayout } from "./components/MainLayout";
import { HeroSection } from "./components/pages/main/HeroSection";
import { MoviesPage } from "./components/pages/movies/MoviesPage";
import { MoviePage } from "./components/pages/movie/MoviePage";
import { LoginPage } from "./components/pages/login/LoginPage";
import { RegistrationPage } from "./components/pages/registration/RegistrationPage";
import { ProfilePage } from "./components/pages/profile/ProfilePage";
import { BooksPage } from "./components/pages/books/BooksPage";
import { MusicPage } from "./components/pages/music/MusicPage";
import { UserActivities } from "./components/pages/profile/UserActivities";
import { UserFriends } from "./components/pages/profile/UserFriends";
import { UserWatchList } from "./components/pages/profile/UserWatchList";
import { UserMessages } from "./components/pages/profile/UserMessages";
import {
    getAuthData,
    getMovie,
    getMovieReviews,
    getMovies,
    getUser,
    getUserActivities,
    getWatchList,
} from "./lib/actions";

export const router = createBrowserRouter([
    {
        Component: MainLayout,
        id: "root",
        loader: async () => {
            const authData = await getAuthData();
            return { authData };
        },
        children: [
            { index: true, Component: HeroSection },
            {
                path: "login",
                Component: LoginPage,
            },
            {
                path: "registration",
                Component: RegistrationPage,
            },
            {
                path: "books",
                Component: BooksPage,
            },
            {
                path: "music",
                Component: MusicPage,
            },
            {
                path: "movies",
                id: "movies",
                loader: async () => {
                    const movies = await getMovies();
                    return { movies };
                },
                children: [
                    {
                        index: true,
                        Component: MoviesPage,
                        loader: async () => {
                            const movies = await getMovies();
                            return { movies };
                        },
                    },
                    {
                        path: ":movieId",
                        Component: MoviePage,
                        loader: async ({ params }) => {
                            const { movieId } = params as { movieId: string };
                            const movie = await getMovie(movieId);
                            const movieReviews = await getMovieReviews(movieId);
                            return { movie, movieReviews };
                        },
                    },
                ],
            },
            {
                path: "users",
                children: [
                    {
                        path: ":userId",
                        id: "userProfile",
                        loader: async ({ params }) => {
                            const { userId } = params as { userId: string };
                            const user = await getUser(userId);
                            return { user };
                        },
                        children: [
                            {
                                path: "profile",
                                Component: ProfilePage,
                            },
                            {
                                path: "activities",
                                Component: UserActivities,
                                loader: async ({ params }) => {
                                    const { userId } = params as {
                                        userId: string;
                                    };
                                    const userActivities =
                                        await getUserActivities(userId);
                                    return { userActivities };
                                },
                            },
                            {
                                path: "friends",
                                Component: UserFriends,
                                loader: async () => {
                                    const authData = await getAuthData();
                                    if (!authData.isAuthenticated) {
                                        return redirect("/");
                                    }
                                },
                            },
                            {
                                path: "messages",
                                Component: UserMessages,
                                loader: async () => {
                                    const authData = await getAuthData();
                                    if (!authData.isAuthenticated) {
                                        return redirect("/");
                                    }
                                },
                            },
                            {
                                path: "watch-list",
                                Component: UserWatchList,
                                loader: async ({ params }) => {
                                    const authData = await getAuthData();
                                    if (!authData.isAuthenticated) {
                                        return redirect("/");
                                    }
                                    const { userId } = params as {
                                        userId: string;
                                    };
                                    const userWatchList = await getWatchList(
                                        userId
                                    );
                                    return { userWatchList };
                                },
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);
