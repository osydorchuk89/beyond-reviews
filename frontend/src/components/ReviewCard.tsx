import axios from "axios";
import { useParams } from "@tanstack/react-router";
import { MovieRating, User } from "../lib/types";
import { useAppSelector } from "../store/hooks";
import { useQuery } from "@tanstack/react-query";
import { getMovieRatings } from "../lib/requests";
import { useRef, useState } from "react";
import { BASE_API_URL } from "../lib/urls";
import { StarIcon } from "./StarIcon";
import { LikeIcon } from "./LikeIcon";
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
    const authData = useAppSelector((state) => state.auth);
    const userId = authData.userData?._id;
    const { data, refetch } = useQuery({
        queryKey: ["movie", "ratings", { movieId: movieId }],
        queryFn: () => getMovieRatings(movieId),
        enabled: false,
    });

    const reviewData = (data as MovieRating[]).find(
        (item) => item._id === reviewId
    );

    const hasUserLikedReview = (reviewData!.userId as User)._id === userId;

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
            refetch();
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
                            !isShowingMore ? "line-clamp-3 w-full" : "w-full"
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
            {authData.isAuthenticated && !isOwnReview && (
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
