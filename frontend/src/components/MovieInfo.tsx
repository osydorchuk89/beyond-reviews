import { useParams } from "@tanstack/react-router";
import { StarIcon } from "./StarIcon";
import { useQuery } from "@tanstack/react-query";
import { getMovie } from "../lib/requests";
import { Movie } from "../lib/types";

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
        enabled: false,
    });

    const avgRating = movieData?.avgRating?.toPrecision(2);
    const numRatings = movieData?.numRatings;
    const genres = movieData?.genres as string[];

    return (
        <div className="flex flex-col gap-5 text-lg mb-5">
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
