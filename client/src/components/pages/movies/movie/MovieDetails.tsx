import { useNavigate } from "react-router";

import { AuthData, Movie } from "../../../../lib/entities";
import { QueryLink } from "../../../ui/QueryLink";
import { StarIcon } from "../../../icons/StarIcon";

interface MovieDetailsProps {
    movie: Movie;
    authData: AuthData;
}

export const MovieDetails = ({ movie }: MovieDetailsProps) => {
    const navigate = useNavigate();

    const handleFilterNavigation = (
        filterType: string,
        filterValue: string
    ) => {
        navigate(`/movies?${filterType}=${encodeURIComponent(filterValue)}`);
    };

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            <p className="font-semibold">
                Directed by:{" "}
                <QueryLink
                    onClick={() =>
                        handleFilterNavigation("director", movie.director)
                    }
                >
                    {movie.director}
                </QueryLink>
            </p>
            <p>
                <QueryLink
                    onClick={() =>
                        handleFilterNavigation(
                            "releaseYear",
                            movie.releaseYear.toString()
                        )
                    }
                >
                    {movie.releaseYear.toString()}
                </QueryLink>
            </p>
            <p>
                {movie.genres.map((item, index) => (
                    <span key={item}>
                        <QueryLink
                            onClick={() =>
                                handleFilterNavigation("genre", item)
                            }
                        >
                            {item}
                        </QueryLink>
                        {index !== movie.genres.length - 1 && " | "}
                    </span>
                ))}
            </p>
            <div className="flex gap-5 text-gray-600 ">
                <span>{movie.runtime} min</span>
                <span className="flex">
                    <StarIcon className="w-6 h-6 fill-sky-500 border-none" />{" "}
                    {movie.avgRating.toPrecision(2)}
                </span>
                <span>
                    {movie.numRatings}{" "}
                    {movie.numRatings === 1 ? "vote" : "votes"}
                </span>
            </div>
            <p>{movie.overview}</p>
        </div>
    );
};
