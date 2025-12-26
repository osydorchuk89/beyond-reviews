import { createBrowserRouter } from "react-router";

import { MainLayout } from "./components/MainLayout";
import { UserLayout } from "./components/pages/user/UserLayout";
import { HeroSection } from "./components/pages/main/HeroSection";
import { MoviesPage } from "./components/pages/movies/MoviesPage";
import { MoviePage } from "./components/pages/movies/movie/MoviePage";
import { LoginPage } from "./components/pages/login/LoginPage";
import { RegistrationPage } from "./components/pages/registration/RegistrationPage";
import { BooksPage } from "./components/pages/books/BooksPage";
import { MusicPage } from "./components/pages/music/MusicPage";
import { ProfilePage } from "./components/pages/user/profile/ProfilePage";
import { UserActivitiesPage } from "./components/pages/user/activities/UserActivitiesPage";
import { UserFriendsPage } from "./components/pages/user/friends/UserFriendsPage";
import { UserMessagesPage } from "./components/pages/user/messages/UserMessagesPage";
import { UserWatchListPage } from "./components/pages/user/watch-list/UserWatchListPage";
import { UserReviewsPage } from "./components/pages/user/reviews/UserReviewsPage";
import { UserSettingsPage } from "./components/pages/user/settings/UserSettingsPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { ErrorPage } from "./components/pages/ErrorPage";
import {
    loginLoader,
    movieLoader,
    moviesLoader,
    protectedLoader,
    rootLoader,
    userActivitiesLoader,
    userProfileLoader,
    userReviewsLoader,
    userWatchListLoader,
} from "./lib/loaders";
import {
    loginAction,
    logoutAction,
    movieReviewAction,
    registrationAction,
} from "./lib/actions";

export const router = createBrowserRouter([
    {
        Component: MainLayout,
        id: "root",
        loader: rootLoader,
        children: [
            {
                children: [
                    { index: true, Component: HeroSection },
                    {
                        path: "login",
                        Component: LoginPage,
                        loader: loginLoader,
                        action: loginAction,
                    },
                    {
                        path: "logout",
                        action: logoutAction,
                    },
                    {
                        path: "registration",
                        Component: RegistrationPage,
                        action: registrationAction,
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
                        children: [
                            {
                                index: true,
                                Component: MoviesPage,
                                loader: moviesLoader,
                            },
                            {
                                path: ":movieId",
                                Component: MoviePage,
                                loader: movieLoader,
                                action: movieReviewAction,
                            },
                        ],
                    },
                    {
                        path: "users",
                        children: [
                            {
                                path: ":userId",
                                id: "userProfile",
                                loader: userProfileLoader,
                                Component: UserLayout,
                                children: [
                                    {
                                        path: "profile",
                                        Component: ProfilePage,
                                    },
                                    {
                                        path: "activities",
                                        Component: UserActivitiesPage,
                                        loader: userActivitiesLoader,
                                    },
                                    {
                                        path: "friends",
                                        Component: UserFriendsPage,
                                        loader: protectedLoader,
                                    },
                                    {
                                        path: "messages",
                                        Component: UserMessagesPage,
                                        loader: protectedLoader,
                                    },
                                    {
                                        path: "watch-list",
                                        Component: UserWatchListPage,
                                        loader: userWatchListLoader,
                                    },
                                    {
                                        path: "reviews",
                                        Component: UserReviewsPage,
                                        loader: userReviewsLoader,
                                    },
                                    {
                                        path: "settings",
                                        Component: UserSettingsPage,
                                        loader: protectedLoader,
                                    },
                                ],
                            },
                        ],
                        ErrorBoundary: ErrorPage,
                    },
                    {
                        path: "*",
                        Component: NotFoundPage,
                    },
                ],
            },
        ],
    },
]);
