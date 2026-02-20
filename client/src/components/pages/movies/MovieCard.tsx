import { Link, useLocation } from "react-router";

import { StarIcon } from "../../icons/StarIcon";
import { useQueryClick } from "../../../hooks/useQueryClick";
import { QueryLink } from "../../ui/QueryLink";
import { useGetMovieGenres } from "../../../hooks/useGetMovieGenres";
import { getMoviePoster } from "../../../lib/utils";

interface MovieCardProps {
    movieId: string;
    title: string;
    releaseYear: number;
    genres: string[];
    avgRating: number;
    numRatings: number;
    poster: string;
}

export const MovieCard = ({
    movieId,
    title,
    releaseYear,
    genres,
    avgRating,
    numRatings,
    poster,
}: MovieCardProps) => {
    const displayedTitle =
        title?.length > 45 ? `${title.substring(0, 45)}...` : title;

    const handleQueryClick = useQueryClick();
    const location = useLocation();

    const onUserPage = location.pathname.startsWith("/users");

    const movieGenres = useGetMovieGenres(genres, onUserPage, handleQueryClick);
    const moviePoster = getMoviePoster(poster);

    console.log(poster);

    return (
        <div className="flex flex-col w-80 justify-start items-center bg-sky-100 rounded-lg shadow-lg p-5 relative">
            <p className="w-full text-center text-xl font-bold h-16 bg-sky-700 rounded-t-lg flex justify-center items-center absolute top-0 p-4">
                <Link
                    className="hover:underline text-sky-50"
                    to={`/movies/${movieId}`}
                >
                    {displayedTitle}
                </Link>
            </p>
            <p className="mb-2 text-sky-950 mt-16">{movieGenres}</p>
            <p className="mb-2 text-sky-950">
                {onUserPage ? (
                    <span>{releaseYear.toString()}</span>
                ) : (
                    <QueryLink
                        onClick={() =>
                            handleQueryClick(
                                "releaseYear",
                                releaseYear.toString(),
                            )
                        }
                    >
                        {releaseYear.toString()}
                    </QueryLink>
                )}
            </p>
            <Link to={`/movies/${movieId}`}>
                <img
                    src={moviePoster}
                    className="rounded-lg"
                    alt="movie poster"
                />
            </Link>
            <div className="flex mt-4">
                <span>
                    <StarIcon className="w-6 h-6 fill-sky-500 border-none" />
                </span>
                <span className="text-sky-950">{avgRating.toPrecision(2)}</span>
                <span className="text-gray-600 ml-5">
                    {numRatings} {numRatings === 1 ? "vote" : "votes"}
                </span>
            </div>
        </div>
    );
};
