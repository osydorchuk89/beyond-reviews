import { ReactNode } from "react";
import { Link } from "react-router";

import { StarIcon } from "../../icons/StarIcon";
import { useQueryClick } from "../../../hooks/useQueryClick";
import { QueryLink } from "../../ui/QueryLink";

interface MediaCardProps {
    to: string;
    title: string;
    releaseYear: number;
    genres: string[];
    avgRating: number;
    numRatings: number;
    poster: string;
    posterAlt: string;
    ratingCountSingular: string;
    ratingCountPlural: string;
    subtitle?: ReactNode;
    genreLimit?: number;
    showGenres?: boolean;
    hasShadow?: boolean;
    imageClassName?: string;
}

export const MediaCard = ({
    to,
    title,
    releaseYear,
    genres,
    avgRating,
    numRatings,
    poster,
    posterAlt,
    ratingCountSingular,
    ratingCountPlural,
    subtitle,
    genreLimit = 3,
    showGenres = true,
    hasShadow = true,
    imageClassName = "rounded-lg",
}: MediaCardProps) => {
    const displayedTitle =
        title?.length > 45 ? `${title.substring(0, 45)}...` : title;
    const handleQueryClick = useQueryClick();
    const displayedGenres = genres.slice(0, genreLimit);

    return (
        <div
            className={`flex flex-col w-76 justify-start items-center bg-sky-100 rounded-lg p-5 relative ${hasShadow && "shadow-lg"}`}
        >
            <p className="w-full text-center text-xl font-bold h-16 bg-sky-700 rounded-t-lg flex justify-center items-center absolute top-0 p-4">
                <Link className="hover:underline text-sky-50" title={title} to={to}>
                    {displayedTitle}
                </Link>
            </p>
            {subtitle && (
                <p className="mb-2 text-sky-950 mt-16 text-center min-h-6">
                    {subtitle}
                </p>
            )}
            {showGenres && (
                <p
                    className={`mb-2 text-sky-950 text-center min-h-6 ${!subtitle ? "mt-16" : ""}`}
                >
                    {displayedGenres.length > 0 ? (
                        displayedGenres.map((genre, index) => (
                            <span key={genre}>
                                <QueryLink
                                    onClick={() =>
                                        handleQueryClick("genre", genre)
                                    }
                                >
                                    {genre}
                                </QueryLink>
                                {index !== displayedGenres.length - 1 && " | "}
                            </span>
                        ))
                    ) : (
                        <span>&nbsp;</span>
                    )}
                </p>
            )}
            <p className="mb-2 text-sky-950">
                <QueryLink
                    onClick={() =>
                        handleQueryClick("releaseYear", releaseYear.toString())
                    }
                >
                    {releaseYear}
                </QueryLink>
            </p>
            <Link to={to}>
                <img src={poster} className={imageClassName} alt={posterAlt} />
            </Link>
            <div className="flex mt-4">
                <span>
                    <StarIcon className="w-6 h-6 fill-sky-500 border-none" />
                </span>
                <span className="text-sky-950">{avgRating.toPrecision(2)}</span>
                <span className="text-gray-600 ml-5">
                    {numRatings}{" "}
                    {numRatings === 1
                        ? ratingCountSingular
                        : ratingCountPlural}
                </span>
            </div>
        </div>
    );
};
