import { useParams } from "@tanstack/react-router";
import { StarIcon } from "./icons/StarIcon";
import { useQuery } from "@tanstack/react-query";
import { getAuthStatus, getMovie, queryClient } from "../lib/requests";
import { AuthStatus, Movie, MovieRating } from "../lib/types";
import { BookMarkIcon } from "./icons/BookMarkIcon";
import { useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../lib/urls";
import { DarkLink } from "./DarkLink";
import { useAppDispatch } from "../store/hooks";
import { infoBarActions } from "../store";

export const MovieMainInfo = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data: movieData } = useQuery<Movie>({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
        enabled: false,
    });

    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-10 w-1/3">
            <p className="text-4xl text-center mb-5">
                {movieData && movieData.title} (
                {movieData && movieData.releaseYear})
            </p>

            <img
                className="w-80 rounded-lg"
                src={movieData && movieData.poster}
            />
        </div>
    );
};

export const MovieAddInfo = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };

    const { data: movieData } = useQuery<Movie>({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
    });

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });

    const userId = authStatus!.userData?._id;
    const isAuthenticated = authStatus!.isAuthenticated;

    const avgRating = movieData?.avgRating?.toPrecision(2);
    const numRatings = movieData?.numRatings;
    const genres = movieData?.genres as string[];

    const hasUserSavedMovie = (movieData!.onWatchList as string[]).includes(
        userId as string
    );

    const [iconFilled, setIconFilled] = useState(hasUserSavedMovie);
    const [hasSaved, setHasSaved] = useState(hasUserSavedMovie);
    const dispatch = useAppDispatch();

    const saveMovie = async () => {
        try {
            await axios({
                method: "put",
                url: BASE_API_URL + "movies/" + movieId,
                withCredentials: true,
                data: { saved: hasSaved ? false : true, userId },
            });
            setHasSaved((prevState) => !prevState);
            hasSaved
                ? dispatch(infoBarActions.showRemovedFromoWatchListBar())
                : dispatch(infoBarActions.showAddedToWatchListBar());
            console.log(hasSaved);
            queryClient.invalidateQueries({
                queryKey: ["movie", { movieId: movieId }],
            });
        } catch (error: any) {
            console.log(error);
        }
    };

    const toolTipStyle =
        "w-fit bg-amber-700 text-amber-50 text-center text-sm py-1 px-2 rounded-md";

    const hasUserRatedMovie = (movieData!.ratings as MovieRating[]).some(
        (item) => item.userId === userId
    );

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            {isAuthenticated && !hasUserRatedMovie && (
                <div className="absolute w-40 top-0 right-0 flex flex-col justify-center items-center transition-opacity">
                    <BookMarkIcon
                        color={iconFilled ? "#f59e0b" : "#ffffff"}
                        handleMouseEnter={() => {
                            hasSaved
                                ? setIconFilled(false)
                                : setIconFilled(true);
                        }}
                        handleMouseLeave={() => {
                            hasSaved
                                ? setIconFilled(true)
                                : setIconFilled(false);
                        }}
                        handleClick={saveMovie}
                    />
                    <div
                        className={
                            (iconFilled && !hasSaved) ||
                            (!iconFilled && hasSaved)
                                ? toolTipStyle
                                : toolTipStyle + " invisible"
                        }
                    >
                        {!hasSaved
                            ? "Add to watchlist"
                            : "Remove from watchlist"}
                    </div>
                </div>
            )}
            <p>
                {genres.slice(0, -1).map((item) => (
                    <span key={item}>
                        <DarkLink
                            search={(prevState) => ({
                                ...prevState,
                                filter: `genre-${item}`,
                            })}
                            resetScroll={false}
                            to="/movies"
                            text={item}
                        />{" "}
                        |{" "}
                    </span>
                ))}
                <DarkLink
                    search={(prevState) => ({
                        ...prevState,
                        filter: `genre-${genres.at(-1)}`,
                    })}
                    resetScroll={false}
                    to="/movies"
                    text={genres.at(-1)!}
                />
            </p>
            <p className="font-bold">
                Directed by:{" "}
                {movieData && (
                    <DarkLink
                        search={(prevState) => ({
                            ...prevState,
                            filter: `director-${movieData.director}`,
                        })}
                        resetScroll={false}
                        to="/movies"
                        text={movieData.director}
                    />
                )}
            </p>
            <div className="flex gap-5 text-gray-600 ">
                <span>{movieData && movieData.runtime} min</span>
                <span className="flex">
                    <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />{" "}
                    {avgRating}
                </span>
                <span>
                    {numRatings} {numRatings === 1 ? "vote" : "votes"}
                </span>
            </div>
            <p>{movieData && movieData.overview}</p>
        </div>
    );
};
