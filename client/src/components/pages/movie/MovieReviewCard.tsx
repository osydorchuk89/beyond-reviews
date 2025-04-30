import { RefObject, useRef, useState } from "react";
import { useLocation } from "react-router";

import { useTruncatedElement } from "../../../hooks/useTruncatedElements";
import { NavLink } from "../../ui/NavLink";
import { StarIcon } from "../../icons/StarIcon";
import { LikeIcon } from "../../icons/LikeIcon";
import { useAppDispatch } from "../../../store/hooks";
import { triggerReviewEvent } from "../../../store";
import { MovieReview } from "../../../lib/entities";
import { sendLikeOrUnlike } from "../../../lib/actions";

interface MovieReviewCardProps {
    movieReview: MovieReview;
    userId?: string;
}

export const MovieReviewCard = ({
    movieReview,
    userId,
}: MovieReviewCardProps) => {
    const { pathname } = useLocation();
    const movieId = pathname.split("/")[2];
    const hasUserLikedReview = movieReview.likedBy.some(
        (like) => like.userId === userId
    );

    const [iconFilled, setIconFilled] = useState(hasUserLikedReview);
    const [hasLiked, setHasLiked] = useState(hasUserLikedReview);

    const reviewDate = new Date(movieReview.date);
    const parsedDate = reviewDate.toLocaleString("default", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const dispatch = useAppDispatch();

    const likeOrUnlikeMovieReview = async () => {
        const date = new Date();
        await sendLikeOrUnlike(movieId, movieReview.id, userId!, hasLiked);
        setHasLiked((prevState) => !prevState);
        dispatch(
            triggerReviewEvent(`new review event at ${date.toString()}`)
        );
    };

    let likeClassName = "w-6 h-6 hover:cursor-pointer";

    const ref = useRef<HTMLParagraphElement>(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({
            ref: ref as RefObject<HTMLParagraphElement>,
        });

    const movieReviewUserName =
        movieReview.user.firstName + " " + movieReview.user.lastName;

    return (
        <div className="flex flex-col items-start bg-sky-100 rounded-lg shadow-lg p-5">
            <div className="flex flex-col w-full mb-5">
                <div className="flex justify-between">
                    <p className="font-semibold">
                        <NavLink
                            text={movieReviewUserName}
                            to={`/users/${movieReview.userId}/profile`}
                        />
                    </p>
                    <div className="flex">
                        <span>
                            <StarIcon className="w-6 h-6 fill-sky-500 border-none" />
                        </span>
                        <span className="font-bold">{movieReview.rating}</span>
                        <span className="text-gray-500 font-bold">/10</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">{parsedDate}</p>
            </div>
            {movieReview.text ? (
                <div>
                    <p
                        ref={ref}
                        className={
                            !isShowingMore ? "line-clamp-5 w-full" : "w-full"
                        }
                    >
                        {movieReview.text}
                    </p>
                    {isTruncated && (
                        <div>
                            <p
                                className="mt-1 text-sky-700 hover:text-green-950 text-base font-medium uppercase cursor-pointer"
                                onClick={toggleIsShowingMore}
                            >
                                {isShowingMore ? "Show less" : "Show more"}
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <p className="w-full text-gray-500 italic mb-5">no review</p>
            )}
            <p className="text-gray-500 text-sm mt-5 mb-1">
                {movieReview.likedBy.length}{" "}
                {movieReview.likedBy.length === 1 ? "like" : "likes"}
            </p>
            {userId && movieReview.userId !== userId && (
                <LikeIcon
                    className={
                        iconFilled
                            ? likeClassName + " fill-sky-600"
                            : likeClassName + " fill-sky-50"
                    }
                    handleClick={likeOrUnlikeMovieReview}
                    handleMouseEnter={() => {
                        hasLiked ? setIconFilled(false) : setIconFilled(true);
                    }}
                    handleMouseLeave={() => {
                        hasLiked ? setIconFilled(true) : setIconFilled(false);
                    }}
                />
            )}
        </div>
    );
};
