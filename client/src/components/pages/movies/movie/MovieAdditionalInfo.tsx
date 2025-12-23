import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ToastContainer, toast } from "react-toastify";

import { AuthData, Movie } from "../../../../lib/entities";
import { useAppDispatch } from "../../../../store/hooks";
import { triggerReviewEvent } from "../../../../store";
import { addOrRemoveMovieFromWatchlist } from "../../../../lib/actions";
import { BookMarkIcon } from "../../../icons/BookMarkIcon";
import { QueryLink } from "../../../ui/QueryLink";
import { StarIcon } from "../../../icons/StarIcon";
import { ToastNotification } from "../../../ui/ToastNotification";

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

    const userHasSavedMovie = useMemo(
        () => movie.onWatchList.some((like) => like.userId === userId),
        [movie.onWatchList, userId]
    );

    const [iconFilled, setIconFilled] = useState(userHasSavedMovie);
    const [hasSaved, setHasSaved] = useState(userHasSavedMovie);

    const dispatch = useAppDispatch();

    const handleFilterNavigation = useCallback(
        (filterType: string, filterValue: string) => {
            navigate(
                `/movies?${filterType}=${encodeURIComponent(filterValue)}`
            );
        },
        [navigate]
    );

    const saveMovie = async () => {
        setHasSaved((prevState) => !prevState);
        setIconFilled((prevState) => !prevState);

        const date = new Date();
        try {
            showNotificationToast();
            await addOrRemoveMovieFromWatchlist(movie.id, userId!, hasSaved);
            dispatch(
                triggerReviewEvent(`new review event at ${date.toString()}`)
            );
        } catch (error) {
            setHasSaved((prevState) => !prevState);
            setIconFilled((prevState) => !prevState);
            console.log(error);
        }
    };

    const getIconColor = () => {
        if (hasSaved && iconFilled) return "#0ea5e9"; // saved, not hovering
        if (hasSaved && !iconFilled) return "#38bdf8"; // saved, hovering
        if (!hasSaved && iconFilled) return "#e0f2fe"; // not saved, hovering
        return "#ffffff"; // not saved, not hovering
    };

    const showNotificationToast = () => {
        console.log(userHasSavedMovie);
        toast.dismiss();
        return toast(
            ({ closeToast }) => (
                <ToastNotification
                    text={`Movie was ${
                        userHasSavedMovie ? "removed from" : "added to"
                    } your watchlist`}
                    closeToast={closeToast}
                />
            ),
            {
                closeButton: false,
            }
        );
    };

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            {authData.user && (
                <div className="absolute w-40 top-0 right-0 flex flex-col justify-center items-center transition-opacity">
                    <ToastContainer
                        autoClose={3000}
                        hideProgressBar
                        toastStyle={{
                            backgroundColor: "#bae6fd",
                            paddingBlock: 0,
                            paddingInline: 20,
                        }}
                    />
                    <BookMarkIcon
                        color={getIconColor()}
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
                </div>
            )}
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
