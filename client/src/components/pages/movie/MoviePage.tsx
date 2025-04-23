import { useEffect, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import { Movie, MovieReview } from "../../../lib/entities";
import { getAuthData, getMovie, getMovieReviews } from "../../../lib/actions";
import { useAppSelector } from "../../../store/hooks";
import { MovieReviewSection } from "./MovieReviewSection";
import { AuthData } from "../../layout/Header";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { MovieReviews } from "./MovieReviews";

interface MovieData {
    movie: Movie;
    movieReviews: MovieReview[];
}

export const MoviePage = () => {
    let { movie, movieReviews }: MovieData = useLoaderData();
    const [movieData, setMovieData] = useState<Movie>(movie);
    const [movieReviewsData, setMovieReviewsData] =
        useState<MovieReview[]>(movieReviews);
    const reviewEvent = useAppSelector((state) => state.reviewEvent);

    useEffect(() => {
        const fetchMovie = async () => {
            const movieData = await getMovie(movie.id);
            setMovieData(movieData);
        };
        const fetchMovieReviews = async () => {
            const movieReviewsData = await getMovieReviews(movie.id);
            setMovieReviewsData(movieReviewsData);
        };
        fetchMovie();
        fetchMovieReviews();
    }, [reviewEvent]);

    const { authData: initialAuthData } = useRouteLoaderData("root");
    const [authData, setAuthData] = useState<AuthData>({
        isAuthenticated: initialAuthData.isAuthenticated,
        user: initialAuthData.user,
    });
    const [authDataFetching, setAuthDataFetching] = useState(true);
    const authEvent = useAppSelector((state) => state.authEvent);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const authData = await getAuthData();
            setAuthData({
                isAuthenticated: authData.isAuthenticated,
                user: authData.user,
            });
            setAuthDataFetching(false);
        };
        checkAuthStatus();
    }, [authEvent]);

    if (authDataFetching) {
        return (
            <div className="flex min-h-[80vh] justify-center items-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col mx-48 text-sky-950">
            <div className="flex gap-10 py-10">
                <MovieMainInfo movie={movie} />
                <div className="flex flex-col w-2/3 text-lg mt-2">
                    <MovieAdditionalInfo movie={movieData} />
                    <MovieReviewSection
                        movie={movieData}
                        movieReviews={movieReviewsData}
                        authData={authData}
                    />
                </div>
            </div>
            <MovieReviews movieReviews={movieReviewsData} authData={authData} />
        </div>
    );
};
