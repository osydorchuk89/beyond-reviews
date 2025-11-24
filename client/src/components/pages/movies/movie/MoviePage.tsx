import { useEffect, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import { MovieReviewSection } from "./MovieReviewSection";
import { MovieReviews } from "./MovieReviews";
import {
    AuthData,
    Movie,
    MovieData,
    MovieReview,
} from "../../../../lib/entities";
import { useAppSelector } from "../../../../store/hooks";
import { getMovie, getMovieReviews } from "../../../../lib/actions";

export const MoviePage = () => {
    // Movie and movie reviews data fetching logic
    const { movie, movieReviews } = useLoaderData() as MovieData;
    const [movieData, setMovieData] = useState<Movie>(movie);
    const [movieReviewsData, setMovieReviewsData] =
        useState<MovieReview[]>(movieReviews);

    const reviewEvent = useAppSelector((state) => state.reviewEvent);

    // Authentification data fetching logic
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };

    useEffect(() => {
        const fetchMovieData = async () => {
            const [movieData, movieReviewsData] = await Promise.all([
                getMovie(movie.id),
                getMovieReviews(movie.id),
            ]);
            setMovieData(movieData);
            setMovieReviewsData(movieReviewsData);
        };
        fetchMovieData();
    }, [reviewEvent, authData]);

    return (
        <div className="flex flex-col mx-48 text-sky-950">
            <div className="flex gap-10 py-10">
                <MovieMainInfo movie={movie} />
                <div className="flex flex-col w-2/3 text-lg mt-2">
                    <MovieAdditionalInfo
                        movie={movieData}
                        authData={authData}
                    />
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
