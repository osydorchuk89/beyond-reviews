import axios from "axios";
import { useState } from "react";
import { useAppSelector } from "../store/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { DarkLink } from "../components/DarkLink";
import { Movie } from "../lib/types";
import { BASE_API_URL } from "../lib/urls";
import { StarIcon } from "../components/StarIcon";

const MovieDetails = () => {
    const movie: Movie = Route.useLoaderData();
    const authData = useAppSelector((state) => state.auth);

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    let starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    return (
        <div className="flex gap-10 mx-48 p-10">
            <div className="flex flex-col flex-wrap justify-between items-center w-1/3">
                <p className="text-4xl text-center mb-5">
                    {movie.title} ({movie.releaseYear})
                </p>

                <img className="w-80 rounded-lg" src={movie.poster} />
            </div>
            <div className="flex flex-col gap-5 w-2/3 text-lg mt-2">
                <p>
                    {movie.genres.slice(0, -1).map((item) => item + " | ")}
                    {movie.genres.at(-1)}
                </p>
                <p className="font-bold">Directed by: {movie.director}</p>
                <div className="flex gap-5 text-gray-600 ">
                    <span>{movie.runtime} min</span>
                    <span className="flex">
                        <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />{" "}
                        {movie.avgVote.toPrecision(2)}
                    </span>
                    <span>{movie.numVotes} votes</span>
                </div>
                <p>{movie.overview}</p>
                <div>
                    <p className="mb-2 font-bold">Rate the movie:</p>
                    {authData.isAuthenticated ? (
                        <div className=" flex">
                            {[...Array(10).keys()].map((index) => {
                                index += 1;
                                return (
                                    <StarIcon
                                        key={index}
                                        className={
                                            index <= (hover || rating)
                                                ? starClassName +
                                                  " fill-amber-500"
                                                : starClassName +
                                                  " fill-amber-200"
                                        }
                                        handleClick={() => setRating(index)}
                                        handleMouseEnter={() => setHover(index)}
                                        handleMouseLeave={() =>
                                            setHover(rating)
                                        }
                                    ></StarIcon>
                                );
                            })}
                        </div>
                    ) : (
                        <p>
                            To rate the movie, please{" "}
                            <DarkLink
                                to="/login"
                                text="login to your account"
                            ></DarkLink>
                            .
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const fetchMovie = async (movieId: string) => {
    try {
        const response = await axios({
            method: "get",
            url: `${BASE_API_URL}movies/${movieId}`,
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const Route = createFileRoute("/movies/$movieId")({
    component: MovieDetails,
    loader: async ({ params }) => {
        return fetchMovie(params.movieId);
    },
});
