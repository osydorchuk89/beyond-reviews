import { Movie } from "../../../lib/entities";
import { StarIcon } from "../../icons/StarIcon";
import { QueryLink } from "../../ui/QueryLink";
import { useFilterNavigation } from "../../../hooks/useFilterNavigation";

interface MovieDetailsProps {
    movie: Movie;
}

export const MovieDetails = ({ movie }: MovieDetailsProps) => {
    const handleFilterNavigation = useFilterNavigation();

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            <div>
                <span className="font-semibold">Directed by: </span>
                <QueryLink
                    isBold
                    onClick={() =>
                        handleFilterNavigation("director", movie.director)
                    }
                >
                    {movie.director}
                </QueryLink>
            </div>
            <div>
                <span className="font-semibold">Cast: </span>
                {movie.cast.slice(0, 5).map((item, index, displayedCast) => (
                    <span key={item}>
                        <QueryLink
                            isBold
                            onClick={() =>
                                handleFilterNavigation("actor", item)
                            }
                        >
                            {item}
                        </QueryLink>
                        {index !== displayedCast.length - 1 && ", "}
                    </span>
                ))}
            </div>
            <div>
                {movie.genres.map((item, index) => (
                    <span key={item}>
                        <QueryLink
                            key={item}
                            onClick={() =>
                                handleFilterNavigation("genre", item)
                            }
                        >
                            {item}
                        </QueryLink>
                        {index !== movie.genres.length - 1 && " | "}
                    </span>
                ))}
            </div>
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
            {movie.overview ? (
                <p>{movie.overview}</p>
            ) : (
                <p className="italic">No overview available.</p>
            )}
        </div>
    );
};
