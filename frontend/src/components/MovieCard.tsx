import { Link } from "@tanstack/react-router";
import { StarIcon } from "./StarIcon";

interface MovieCardProps {
    _id: string;
    title: string;
    releaseYear: number;
    genres: string[];
    avgRating: number;
    numRatings: number;
    poster: string;
}

export const MovieCard = ({
    _id,
    title,
    releaseYear,
    genres,
    avgRating,
    numRatings,
    poster,
}: MovieCardProps) => {
    const mainGenres =
        genres.length > 1 ? `${genres[0]} | ${genres[1]}` : genres[0];

    return (
        <div className="flex flex-col w-80 justify-start items-center bg-amber-100 rounded-lg shadow-lg p-5">
            <p className="text-center text-lg font-bold h-14 mb-2">
                <Link
                    className="hover:underline"
                    to="/movies/$movieId"
                    params={{
                        movieId: _id,
                    }}
                >
                    {title} ({releaseYear})
                </Link>
            </p>
            <p className="mb-2">{mainGenres}</p>
            <img src={poster} className="rounded-lg" />
            <div className="flex mt-4">
                <span>
                    <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />
                </span>
                <span>{avgRating.toPrecision(2)}</span>
                <span className="text-gray-600 ml-5">{numRatings} votes</span>
            </div>
        </div>
    );
};
