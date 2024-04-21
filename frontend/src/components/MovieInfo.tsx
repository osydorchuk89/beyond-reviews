import { useParams } from "@tanstack/react-router";
import { StarIcon } from "./icons/StarIcon";
import { useQuery } from "@tanstack/react-query";
import { getAuthStatus, getMovie, queryClient } from "../lib/requests";
import { AuthStatus, Movie } from "../lib/types";
import { LoveIcon } from "./icons/LoveIcon";
import { useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../lib/urls";

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
        // enabled: false,
    });

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        // enabled: false,
    });

    const userId = authStatus!.userData?._id;
    const isAuthenticated = authStatus!.isAuthenticated;

    const avgRating = movieData?.avgRating?.toPrecision(2);
    const numRatings = movieData?.numRatings;
    const genres = movieData?.genres as string[];

    const hasUserLikedMovie = (movieData!.likedBy as string[]).includes(
        userId as string
    );

    const [iconFilled, setIconFilled] = useState(hasUserLikedMovie);
    const [hasLiked, setHasLiked] = useState(hasUserLikedMovie);

    const likeMovie = async () => {
        try {
            await axios({
                method: "put",
                url: BASE_API_URL + "movies/" + movieId,
                withCredentials: true,
                data: { like: hasLiked ? false : true, userId },
            });
            setHasLiked((prevState) => !prevState);
            queryClient.invalidateQueries({
                queryKey: ["movie", { movieId: movieId }],
            });
        } catch (error: any) {
            console.log(error);
        }
    };

    const toolTipStyle =
        "w-fit bg-amber-700 text-amber-50 text-center text-sm py-1 px-2 rounded-md";

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            {isAuthenticated && (
                <div className="absolute w-40 top-0 right-0 flex flex-col justify-center items-center transition-opacity">
                    <LoveIcon
                        color={iconFilled ? "#f59e0b" : "#ffffff"}
                        handleMouseEnter={() => {
                            hasLiked
                                ? setIconFilled(false)
                                : setIconFilled(true);
                        }}
                        handleMouseLeave={() => {
                            hasLiked
                                ? setIconFilled(true)
                                : setIconFilled(false);
                        }}
                        handleClick={likeMovie}
                    />
                    <div
                        className={
                            (iconFilled && !hasLiked) ||
                            (!iconFilled && hasLiked)
                                ? toolTipStyle
                                : toolTipStyle + " invisible"
                        }
                    >
                        {!hasLiked
                            ? "Add to favorites"
                            : "Remove from favorites"}
                    </div>
                </div>
            )}
            <p>
                {genres.slice(0, -1).map((item) => item + " | ")}
                {genres.at(-1)}
            </p>
            <p className="font-bold">
                Directed by: {movieData && movieData.director}
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
