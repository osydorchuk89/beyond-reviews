import { createBrowserRouter, redirect } from "react-router";

import { MainLayout } from "./components/MainLayout";
import { HeroSection } from "./components/pages/main/HeroSection";
import { MoviesPage } from "./components/pages/movies/MoviesPage";
import { MoviePage } from "./components/pages/movie/MoviePage";
import { LoginPage } from "./components/pages/login/LoginPage";
import { RegistrationPage } from "./components/pages/registration/RegistrationPage";
import { ProfilePage } from "./components/pages/profile/ProfilePage";
import {
    getAuthData,
    getMovie,
    getMovieReviews,
    getMovies,
    getUserActivities,
} from "./lib/actions";
import { BooksPage } from "./components/pages/books/BooksPage";
import { MusicPage } from "./components/pages/music/MusicPage";
import { UserActivities } from "./components/pages/profile/UserActivities";

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
                path: "profile",
                id: "profile",
                loader: async () => {
                    const authData = await getAuthData();
                    if (authData.user) {
                        const userActivities = await getUserActivities(
                            authData.user.id
                        );
                        return {
                            user: authData.user,
                            userActivities: userActivities,
                        };
                    } else {
                        return redirect("/");
                    }
                },
                children: [
                    {
                        index: true,
                        Component: ProfilePage,
                    },
                    {
                        path: "activities",
                        Component: UserActivities,
                    },
                ],
            },
        ],
    },
]);
