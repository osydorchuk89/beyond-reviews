import { createBrowserRouter } from "react-router";

import { MainLayout } from "./components/MainLayout";
import { HeroSection } from "./components/pages/main/HeroSection";
import { MoviesPage } from "./components/pages/movies/MoviesPage";
import { MoviePage } from "./components/pages/movies/movie/MoviePage";
import { LoginPage } from "./components/pages/login/LoginPage";
import { RegistrationPage } from "./components/pages/registration/RegistrationPage";
import { BooksPage } from "./components/pages/books/BooksPage";
import { MusicPage } from "./components/pages/music/MusicPage";
import { UserLayout } from "./components/pages/user/UserLayout";
import { ProfilePage } from "./components/pages/user/profile/ProfilePage";
import { UserActivities } from "./components/pages/user/activities/UserActivities";
import { UserFriends } from "./components/pages/user/friends/UserFriends";
import { UserMessages } from "./components/pages/user/messages/UserMessages";
import { UserWatchList } from "./components/pages/user/watch-list/UserWatchList";
import { UserReviews } from "./components/pages/user/reviews/UserReviews";
import { UserSettings } from "./components/pages/user/settings/UserSettings";
import {
    movieLoader,
    moviesLoader,
    protectedLoader,
    rootLoader,
    userActivitiesLoader,
    userProfileLoader,
    userReviewsLoader,
    userWatchListLoader,
} from "./lib/loaders";

export const router = createBrowserRouter([
    {
        Component: MainLayout,
        id: "root",
        loader: rootLoader,
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
                                Component: UserActivities,
                                loader: userActivitiesLoader,
                            },
                            {
                                path: "friends",
                                Component: UserFriends,
                                loader: protectedLoader,
                            },
                            {
                                path: "messages",
                                Component: UserMessages,
                                loader: protectedLoader,
                            },
                            {
                                path: "watch-list",
                                Component: UserWatchList,
                                loader: userWatchListLoader,
                            },
                            {
                                path: "reviews",
                                Component: UserReviews,
                                loader: userReviewsLoader,
                            },
                            {
                                path: "settings",
                                Component: UserSettings,
                                loader: protectedLoader,
                            },
                        ],
                    },
                ],
            },
        ],
    },
]);
