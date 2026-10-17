import {
    createBrowserRouter,
    type ShouldRevalidateFunctionArgs,
} from "react-router";

import { MainLayout } from "./components/MainLayout";
import { UserLayout } from "./components/pages/user/UserLayout";
import { HeroSection } from "./components/pages/main/HeroSection";
import { MoviesPage } from "./components/pages/movies/MoviesPage";
import { LoginPage } from "./components/pages/login/LoginPage";
import { RegistrationPage } from "./components/pages/registration/RegistrationPage";
import { BooksPage } from "./components/pages/books/BooksPage";
import { MusicPage } from "./components/pages/music/MusicPage";
import { ProfilePage } from "./components/pages/user/profile/ProfilePage";
import { UserActivitiesPage } from "./components/pages/user/activities/UserActivitiesPage";
import { UserFriendsPage } from "./components/pages/user/friends/UserFriendsPage";
import { UserMessagesPage } from "./components/pages/user/messages/UserMessagesPage";
import { UserWishlistPage } from "./components/pages/user/wishlist/UserWishlistPage";
import { UserReviewsPage } from "./components/pages/user/reviews/UserReviewsPage";
import { UserSettingsPage } from "./components/pages/user/settings/UserSettingsPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { ErrorPage, RootErrorPage } from "./components/pages/ErrorPage";
import {
    loginLoader,
    booksLoader,
    bookLoader,
    movieLoader,
    moviesLoader,
    protectedLoader,
    rootLoader,
    userActivitiesLoader,
    userFriendsLoader,
    userProfileLoader,
    userReviewsLoader,
    userWishlistLoader,
} from "./lib/loaders";
import {
    loginAction,
    logoutAction,
    movieReviewAction,
    bookReviewAction,
    registrationAction,
} from "./lib/actions";
import { MoviesLayout } from "./components/pages/movies/MoviesLayout";
import { MoviePage } from "./components/pages/movie/MoviePage";
import { BookPage } from "./components/pages/book/BookPage";
import type { BookData, MovieData } from "./lib/entities";

const revalidateAfterReview = ({
    actionResult,
    formAction,
    defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
    // Failed saves must not replace the draft with refreshed page/auth data.
    if (
        actionResult?.error &&
        /\/(books|movies)\/[^/?]+$/.test(formAction ?? "")
    ) {
        return false;
    }
    return defaultShouldRevalidate;
};

export const router = createBrowserRouter([
    {
        Component: MainLayout,
        ErrorBoundary: RootErrorPage,
        id: "root",
        loader: rootLoader,
        shouldRevalidate: revalidateAfterReview,
        children: [
            {
                ErrorBoundary: ErrorPage,
                children: [
                    {
                        index: true,
                        Component: HeroSection,
                        handle: { title: "Home" },
                    },
                    {
                        path: "login",
                        Component: LoginPage,
                        handle: { title: "Log in" },
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
                        handle: { title: "Register" },
                        action: registrationAction,
                    },
                    {
                        path: "books",
                        children: [
                            {
                                index: true,
                                Component: BooksPage,
                                handle: { title: "Books" },
                                loader: booksLoader,
                            },
                            {
                                path: ":bookId",
                                Component: BookPage,
                                handle: {
                                    title: (data: unknown) =>
                                        (data as BookData | undefined)?.book
                                            ?.title ?? "Book not found",
                                },
                                loader: bookLoader,
                                shouldRevalidate: revalidateAfterReview,
                                action: bookReviewAction,
                            },
                        ],
                    },
                    {
                        path: "music",
                        Component: MusicPage,
                        handle: { title: "Music" },
                    },
                    {
                        path: "movies",
                        id: "movies",
                        Component: MoviesLayout,
                        children: [
                            {
                                index: true,
                                Component: MoviesPage,
                                handle: { title: "Movies" },
                                loader: moviesLoader,
                            },
                            {
                                path: ":movieId",
                                Component: MoviePage,
                                handle: {
                                    title: (data: unknown) =>
                                        (data as MovieData | undefined)?.movie
                                            ?.title ?? "Movie not found",
                                },
                                loader: movieLoader,
                                shouldRevalidate: revalidateAfterReview,
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
                                        handle: { title: "Profile" },
                                    },
                                    {
                                        path: "activities",
                                        Component: UserActivitiesPage,
                                        handle: { title: "Activities" },
                                        loader: userActivitiesLoader,
                                    },
                                    {
                                        path: "friends",
                                        Component: UserFriendsPage,
                                        handle: { title: "Friends" },
                                        loader: userFriendsLoader,
                                    },
                                    {
                                        path: "messages",
                                        Component: UserMessagesPage,
                                        handle: { title: "Messages" },
                                        loader: protectedLoader,
                                    },
                                    {
                                        path: "wishlist",
                                        Component: UserWishlistPage,
                                        handle: { title: "Wishlist" },
                                        loader: userWishlistLoader,
                                    },
                                    {
                                        path: "watch-list",
                                        Component: UserWishlistPage,
                                        handle: { title: "Wishlist" },
                                        loader: userWishlistLoader,
                                    },
                                    {
                                        path: "reviews",
                                        Component: UserReviewsPage,
                                        handle: { title: "Reviews" },
                                        loader: userReviewsLoader,
                                    },
                                    {
                                        path: "settings",
                                        Component: UserSettingsPage,
                                        handle: { title: "Settings" },
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
                        handle: { title: "Page not found" },
                    },
                ],
            },
        ],
    },
]);
