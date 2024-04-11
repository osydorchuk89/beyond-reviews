import { useParams } from "@tanstack/react-router";
import { StarIcon } from "./StarIcon";
import { useQuery } from "@tanstack/react-query";
import { getMovie } from "../lib/requests";

export const MovieMainInfo = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data } = useQuery({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
        enabled: false,
    });
    return (
        <div className="flex flex-col flex-wrap justify-between items-center w-1/3">
            <p className="text-4xl text-center mb-5">
                {data.title} ({data.releaseYear})
            </p>

            <img className="w-80 rounded-lg" src={data.poster} />
        </div>
    );
};

export const MovieAddInfo = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };

    const { data } = useQuery({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
        enabled: false,
    });

    const avgRating = data.avgRating?.toPrecision(2);
    const numRatings = data.numRatings;
    const genres = data.genres as string[];

    return (
        <div className="flex flex-col gap-5 text-lg mb-5">
            <p>
                {genres.slice(0, -1).map((item) => item + " | ")}
                {genres.at(-1)}
            </p>
            <p className="font-bold">Directed by: {data.director}</p>
            <div className="flex gap-5 text-gray-600 ">
                <span>{data.runtime} min</span>
                <span className="flex">
                    <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />{" "}
                    {avgRating}
                </span>
                <span>{numRatings} votes</span>
            </div>
            <p>{data.overview}</p>
        </div>
    );
};
