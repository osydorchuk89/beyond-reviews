import { RefObject, useRef, useState } from "react";
import { useRouteLoaderData } from "react-router";

import { useTruncatedElement } from "../../../hooks/useTruncatedElements";
import { AuthData } from "../../../lib/entities";
import { LikeIcon } from "../../icons/LikeIcon";
import { StarIcon } from "../../icons/StarIcon";
import { BaseLink } from "../../ui/BaseLink";

export interface MediaReviewCardData {
    id: string;
    userId: string;
    user: { id: string; firstName: string; lastName: string };
    date: Date | string;
    rating: number;
    text?: string | null;
    likeCount: number;
    likedBy: { userId: string }[];
}

interface MediaReviewCardProps<TReview extends MediaReviewCardData> {
    review: TReview;
    mediaId: string;
    likeOrUnlikeReview: (
        mediaId: string,
        reviewId: string,
        userId: string,
        hasLiked: boolean,
    ) => Promise<void>;
}

export const MediaReviewCard = <TReview extends MediaReviewCardData>({
    review,
    mediaId,
    likeOrUnlikeReview,
}: MediaReviewCardProps<TReview>) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const userId = authData.user?.id;

    const hasUserLikedReview = review.likedBy.some(
        (like) => like.userId === userId,
    );

    const [iconFilled, setIconFilled] = useState(hasUserLikedReview);
    const [hasLiked, setHasLiked] = useState(hasUserLikedReview);
    const [likeCount, setLikeCount] = useState(
        review.likeCount ?? review.likedBy.length,
    );

    const reviewDate = new Date(review.date);
    const parsedDate = reviewDate.toLocaleString("default", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    const handleLikeOrUnlikeReview = async () => {
        setHasLiked((prevState) => !prevState);
        setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));
        try {
            if (userId) {
                await likeOrUnlikeReview(mediaId, review.id, userId, hasLiked);
            }
        } catch (error) {
            setHasLiked((prevState) => !prevState);
            setLikeCount((prev) => (hasLiked ? prev + 1 : prev - 1));
            console.log(error);
        }
    };

    const ref = useRef<HTMLParagraphElement>(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({
            ref: ref as RefObject<HTMLParagraphElement>,
        });

    return (
        <div className="flex flex-col items-start bg-sky-100 rounded-lg shadow-lg p-5">
            <div className="flex flex-col w-full mb-5">
                <div className="flex justify-between">
                    <p className="font-semibold">
                        <BaseLink to={`/users/${review.userId}/profile`}>
                            {review.user.firstName} {review.user.lastName}
                        </BaseLink>
                    </p>
                    <div className="flex">
                        <span>
                            <StarIcon className="w-6 h-6 fill-sky-500 border-none" />
                        </span>
                        <span className="font-bold">{review.rating}</span>
                        <span className="text-gray-500 font-bold">/10</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">{parsedDate}</p>
            </div>
            {review.text ? (
                <div>
                    <p
                        ref={ref}
                        className={
                            isShowingMore ? "w-full" : "line-clamp-5 w-full"
                        }
                    >
                        {review.text}
                    </p>
                    {isTruncated && (
                        <div>
                            <button
                                className="mt-1 text-sky-700 hover:text-green-950 text-base font-medium uppercase cursor-pointer"
                                onClick={toggleIsShowingMore}
                            >
                                {isShowingMore ? "Show less" : "Show more"}
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <p className="w-full text-gray-500 italic mb-5">no review</p>
            )}
            <p className="text-gray-500 text-sm mt-5 mb-1">
                {likeCount} {likeCount === 1 ? "like" : "likes"}
            </p>
            {userId && review.userId !== userId && (
                <LikeIcon
                    className={`w-6 h-6 hover:cursor-pointer ${
                        iconFilled ? " fill-sky-600" : " fill-sky-50"
                    }`}
                    handleClick={handleLikeOrUnlikeReview}
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
