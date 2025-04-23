import { Movie } from "../../../lib/entities";
import { StarIcon } from "../../icons/StarIcon";
import { QueryLink } from "../../ui/QueryLink";
import { useQueryClick } from "../../../hooks/useQueryClick";

export const MovieAdditionalInfo = ({ movie }: { movie: Movie }) => {
    const handleQueryClick = useQueryClick();

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            {/* <div className="absolute w-40 top-0 right-0 flex flex-col justify-center items-center transition-opacity">
                <BookMarkIcon
                    color={iconFilled ? "#f59e0b" : "#ffffff"}
                    handleMouseEnter={() => {
                        hasSaved ? setIconFilled(false) : setIconFilled(true);
                    }}
                    handleMouseLeave={() => {
                        hasSaved ? setIconFilled(true) : setIconFilled(false);
                    }}
                    handleClick={saveMovie}
                />
                <div
                    className={
                        (iconFilled && !hasSaved) || (!iconFilled && hasSaved)
                            ? toolTipStyle
                            : toolTipStyle + " invisible"
                    }
                >
                    {!hasSaved ? "Add to watchlist" : "Remove from watchlist"}
                </div>
            </div> */}
            <p className="font-semibold">
                Directed by:{" "}
                <QueryLink
                    text={movie.director}
                    onClick={() => handleQueryClick("director", movie.director)}
                />
            </p>
            <p>
                <QueryLink
                    text={movie.releaseYear.toString()}
                    onClick={() =>
                        handleQueryClick("year", movie.releaseYear.toString())
                    }
                />
            </p>
            <p>
                {movie.genres.map((item, index) => (
                    <span key={item}>
                        <QueryLink
                            text={item}
                            onClick={() => handleQueryClick("genre", item)}
                        />
                        {index !== movie.genres.length - 1 && " | "}
                    </span>
                ))}
            </p>
            <div className="flex gap-5 text-gray-600 ">
                <span>{movie.runtime} min</span>
                <span className="flex">
                    <StarIcon className="w-6 h-6 fill-sky-500 border-none" />{" "}
                    {movie.avgRating}
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
