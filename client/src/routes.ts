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
                children: [
                    {
                        index: true,
                        Component: ProfilePage,
                        loader: async () => {
                            const response = await getAuthData();
                            if (response.isAuthenticated) {
                                return { user: response.user };
                            } else {
                                return redirect("/");
                            }
                        },
                    },
                ],
            },
        ],
    },
]);
