import { useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";

import { BookMarkIcon } from "../../../icons/BookMarkIcon";
import { AuthData, Movie } from "../../../../lib/entities";
import { ToastNotification } from "../../../ui/ToastNotification";
import { addOrRemoveMovieFromWatchlist } from "../../../../lib/actions";

interface MovieBookmarkProps {
    movie: Movie;
    authData: AuthData;
}

export const MovieBookmark = ({ movie, authData }: MovieBookmarkProps) => {
    const userId = authData.user?.id;
    const userHasSavedMovie = useMemo(
        () => movie.onWatchList.some((like) => like.userId === userId),
        [movie.onWatchList, userId]
    );
    const [iconFilled, setIconFilled] = useState(userHasSavedMovie);
    const [hasSaved, setHasSaved] = useState(userHasSavedMovie);

    const getIconColor = () => {
        if (hasSaved && iconFilled) return "#0ea5e9"; // saved, not hovering
        if (hasSaved && !iconFilled) return "#38bdf8"; // saved, hovering
        if (!hasSaved && iconFilled) return "#e0f2fe"; // not saved, hovering
        return "#ffffff"; // not saved, not hovering
    };

    const showNotificationToast = () => {
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

    const saveMovie = async () => {
        if (userId) {
            setHasSaved((prevState) => !prevState);
            setIconFilled((prevState) => !prevState);
            try {
                showNotificationToast();
                await addOrRemoveMovieFromWatchlist(movie.id, userId, hasSaved);
            } catch (error) {
                setHasSaved((prevState) => !prevState);
                setIconFilled((prevState) => !prevState);
                console.log(error);
            }
        }
    };

    return (
        <div className="absolute w-40 top-10 right-0 flex flex-col justify-center items-end transition-opacity">
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
                    hasSaved ? setIconFilled(false) : setIconFilled(true);
                }}
                handleMouseLeave={() => {
                    hasSaved ? setIconFilled(true) : setIconFilled(false);
                }}
                handleClick={saveMovie}
            />
        </div>
    );
};
