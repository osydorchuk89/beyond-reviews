import axios from "axios";
import { useParams } from "@tanstack/react-router";
import { AuthStatus, MovieRating, User } from "../lib/types";
import { useQuery } from "@tanstack/react-query";
import { getAuthStatus, getMovieRatings, queryClient } from "../lib/requests";
import { useRef, useState } from "react";
import { BASE_API_URL } from "../lib/urls";
import { StarIcon } from "./icons/StarIcon";
import { LikeIcon } from "./icons/LikeIcon";
import { useTruncatedElement } from "../hooks/useTuncatedElement";
import { Button } from "./Button";

interface ReviewCardProps {
    reviewId: string;
    user: User;
    rating: number;
    review?: string;
    date: Date;
    likes: number;
    isOwnReview: boolean;
}

export const ReviewCard = ({
    reviewId,
    user,
    rating,
    review,
    date,
    likes,
    isOwnReview,
}: ReviewCardProps) => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data: movieRatings } = useQuery<MovieRating[]>({
        queryKey: ["movie", "ratings", { movieId: movieId }],
        queryFn: () => getMovieRatings(movieId),
        // enabled: false,
    });

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const isAuthenticated = authStatus!.isAuthenticated;
    const userId = authStatus!.userData?._id;

    const reviewData = movieRatings!.find((item) => item._id === reviewId);
    const hasUserLikedReview = (reviewData!.likedBy as string[]).includes(
        userId as string
    );

    const [iconFilled, setIconFilled] = useState(hasUserLikedReview);
    const [hasLiked, setHasLiked] = useState(hasUserLikedReview);

    const reviewDate = new Date(date);
    const parsedDate = reviewDate.toLocaleString("default", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const likeReview = async () => {
        try {
            await axios({
                method: "put",
                url:
                    BASE_API_URL + "movies/" + movieId + "/ratings/" + reviewId,
                withCredentials: true,
                data: { like: hasLiked ? false : true, userId },
            });
            setHasLiked((prevState) => !prevState);
            queryClient.invalidateQueries({
                queryKey: ["movie", "ratings", { movieId: movieId }],
            });
        } catch (error: any) {
            console.log(error);
        }
    };

    let likeClassName = "w-6 h-6 hover:cursor-pointer";

    const ref = useRef(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({
            ref,
        });

    return (
        <div className="flex flex-col items-start bg-amber-100 rounded-lg shadow-lg p-5">
            <div className="flex flex-col w-full mb-5">
                <div className="flex justify-between">
                    <p className="font-bold">
                        {user.firstName} {user.lastName}
                    </p>
                    <div className="flex">
                        <span>
                            <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />
                        </span>
                        <span className="font-bold">{rating}</span>
                        <span className="text-gray-500 font-bold">/10</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">{parsedDate}</p>
            </div>
            {review ? (
                <div>
                    <p
                        ref={ref}
                        className={
                            !isShowingMore ? "line-clamp-5 w-full" : "w-full"
                        }
                    >
                        {review}
                    </p>
                    {isTruncated && (
                        <div>
                            <Button
                                style="text-green-700 hover:text-green-950 text-sm font-medium uppercase"
                                text={isShowingMore ? "Show less" : "Show more"}
                                handleClick={toggleIsShowingMore}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <p className="w-full text-gray-500 italic mb-5">no review</p>
            )}
            <p className="text-gray-500 text-sm mt-5 mb-1">
                {likes} {likes === 1 ? "like" : "likes"}
            </p>
            {isAuthenticated && !isOwnReview && (
                <LikeIcon
                    className={
                        iconFilled
                            ? likeClassName + " fill-amber-500"
                            : likeClassName + " fill-amber-50"
                    }
                    handleClick={likeReview}
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
