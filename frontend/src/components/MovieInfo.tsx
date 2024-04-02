import { useLoaderData, useParams } from "@tanstack/react-router";
import { Movie } from "../lib/types";
import { StarIcon } from "./StarIcon";
import { useQuery } from "@tanstack/react-query";
import { getMovie } from "../lib/requests";
import { LoadingSpinner } from "./LoadingSpinner";

export const MovieMainInfo = () => {
    const movie: Movie = useLoaderData({ from: "/movies/$movieId" });
    return (
        <div className="flex flex-col flex-wrap justify-between items-center w-1/3">
            <p className="text-4xl text-center mb-5">
                {movie.title} ({movie.releaseYear})
            </p>

            <img className="w-80 rounded-lg" src={movie.poster} />
        </div>
    );
};

export const MovieAddInfo = () => {
    const movie: Movie = useLoaderData({ from: "/movies/$movieId" });
    const { movieId } = useParams({ strict: false }) as { movieId: string };

    const { data, isFetching } = useQuery({
        queryKey: ["movie", "info"],
        queryFn: () => getMovie(movieId),
    });

    const avgRating =
        data?.avgRating?.toPrecision(2) ||
        movie.avgRating?.toPrecision(2) ||
        "N/A";
    const numRatings = data?.numRatings || movie.numRatings || 0;

    return (
        <div className="flex flex-col gap-5 text-lg mb-5">
            <p>
                {movie.genres.slice(0, -1).map((item) => item + " | ")}
                {movie.genres.at(-1)}
            </p>
            <p className="font-bold">Directed by: {movie.director}</p>
            <div className="flex gap-5 text-gray-600 ">
                <span>{movie.runtime} min</span>
                {isFetching ? (
                    <LoadingSpinner />
                ) : (
                    <span className="flex">
                        <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />{" "}
                        {avgRating}
                    </span>
                )}

                <span>{numRatings} votes</span>
            </div>
            <p>{movie.overview}</p>
        </div>
    );
};
