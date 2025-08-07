import { useState } from "react";
import { useNavigate } from "react-router";

import { AuthData, Movie } from "../../../../lib/entities";
import { useAppDispatch } from "../../../../store/hooks";
import { triggerReviewEvent } from "../../../../store";
import { addOrRemoveMovieFromWatchlist } from "../../../../lib/actions";
import { BookMarkIcon } from "../../../icons/BookMarkIcon";
import { QueryLink } from "../../../ui/QueryLink";
import { StarIcon } from "../../../icons/StarIcon";

interface MovieAdditionalInfoProps {
    movie: Movie;
    authData: AuthData;
}

export const MovieAdditionalInfo = ({
    movie,
    authData,
}: MovieAdditionalInfoProps) => {
    const navigate = useNavigate();
    const userId = authData.user?.id;

    const hasUserSavedMovie = movie.onWatchList.some(
        (like) => like.userId === userId
    );

    const [iconFilled, setIconFilled] = useState(hasUserSavedMovie);
    const [hasSaved, setHasSaved] = useState(hasUserSavedMovie);

    const toolTipStyle =
        "w-fit bg-sky-500 text-sky-50 text-center text-sm py-1 px-2 rounded-md";

    const dispatch = useAppDispatch();

    const handleFilterNavigation = (paramType: string, value: string) => {
        const searchParams = new URLSearchParams();

        if (paramType === "genre") {
            searchParams.set("genre", value);
        } else if (paramType === "releaseYear") {
            searchParams.set("releaseYear", value);
        } else if (paramType === "director") {
            searchParams.set("director", value);
        }

        navigate(`/movies?${searchParams.toString()}`);
    };

    const saveMovie = async () => {
        const date = new Date();
        try {
            await addOrRemoveMovieFromWatchlist(movie.id, userId!, hasSaved);
            setHasSaved((prevState) => !prevState);
            dispatch(
                triggerReviewEvent(`new review event at ${date.toString()}`)
            );
        } catch (error: any) {
            console.log(error);
        }
    };

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            {authData.user && (
                <div className="absolute w-40 top-0 right-0 flex flex-col justify-center items-center transition-opacity">
                    <BookMarkIcon
                        color={iconFilled ? "#0ea5e9" : "#ffffff"}
                        handleMouseEnter={() => {
                            hasSaved
                                ? setIconFilled(false)
                                : setIconFilled(true);
                        }}
                        handleMouseLeave={() => {
                            hasSaved
                                ? setIconFilled(true)
                                : setIconFilled(false);
                        }}
                        handleClick={saveMovie}
                    />
                    <div
                        className={
                            (iconFilled && !hasSaved) ||
                            (!iconFilled && hasSaved)
                                ? toolTipStyle
                                : toolTipStyle + " invisible"
                        }
                    >
                        {!hasSaved
                            ? "Add to watchlist"
                            : "Remove from watchlist"}
                    </div>
                </div>
            )}
            <p className="font-semibold">
                Directed by:{" "}
                <QueryLink
                    text={movie.director}
                    onClick={() =>
                        handleFilterNavigation("director", movie.director)
                    }
                />
            </p>
            <p>
                <QueryLink
                    text={movie.releaseYear.toString()}
                    onClick={() =>
                        handleFilterNavigation(
                            "releaseYear",
                            movie.releaseYear.toString()
                        )
                    }
                />
            </p>
            <p>
                {movie.genres.map((item, index) => (
                    <span key={item}>
                        <QueryLink
                            text={item}
                            onClick={() =>
                                handleFilterNavigation("genre", item)
                            }
                        />
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
