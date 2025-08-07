import { useRef, useState, RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthData, Movie, MovieReview } from "../../../../lib/entities";
import { ReviewSchema } from "../../../../lib/schemas";
import { useAppDispatch } from "../../../../store/hooks";
import { sendMovieReview } from "../../../../lib/actions";
import { triggerReviewEvent } from "../../../../store";
import { useTruncatedElement } from "../../../../hooks/useTruncatedElements";
import { StarIcon } from "../../../icons/StarIcon";
import { BaseButton } from "../../../ui/BaseButton";
import { NavLink } from "../../../ui/NavLink";

interface MovieData {
    movie: Movie;
    movieReviews: MovieReview[];
    authData: AuthData;
}

interface ReviewInputs {
    rating: number;
    text?: string;
}

export const MovieReviewSection = ({
    movie,
    movieReviews,
    authData,
}: MovieData) => {
    let userRating = 0;
    let userReview = "";

    if (authData.user) {
        userRating =
            movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
                ?.rating || 0;
        userReview =
            movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
                ?.text || "";
    }

    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(userRating);
    const [hover, setHover] = useState(userRating);
    const [hasRated, setHasRated] = useState(userRating > 0 ? true : false);

    const [localUserRating, setLocalUserRating] = useState(userRating);
    const [localUserReview, setLocalUserReview] = useState(userReview);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ReviewInputs>({
        resolver: zodResolver(ReviewSchema),
    });

    const dispatch = useAppDispatch();

    const handleUserReview = handleSubmit(async (data: ReviewInputs) => {
        const date = new Date();
        try {
            setLocalUserRating(data.rating);
            setLocalUserReview(data.text || "");

            await sendMovieReview(movie.id, authData.user!.id, data);
            dispatch(
                triggerReviewEvent(`new review event at ${date.toString()}`)
            );
            setHasRated(true);
            setIsEditing(false);
            reset();
        } catch (error) {
            setLocalUserRating(userRating);
            setLocalUserReview(userReview);
            console.log(error);
        }
    });

    // local state for display
    const displayRating = localUserRating;
    const displayReview = localUserReview;

    const editUserReview = () => {
        setValue("rating", userRating, {
            shouldValidate: true,
        });
        setValue("text", userReview, {
            shouldValidate: true,
        });
        setIsEditing(true);
    };

    let starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    const ref = useRef<HTMLParagraphElement>(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({ ref: ref as RefObject<HTMLParagraphElement> });

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <form noValidate onSubmit={handleUserReview}>
                        <p className="font-bold">Rate the movie:</p>
                        <div className="flex">
                            {[...Array(10).keys()].map((index) => {
                                index += 1;
                                return (
                                    <div key={index}>
                                        <StarIcon
                                            className={
                                                index <= (hover || rating)
                                                    ? starClassName +
                                                      " fill-orange-500"
                                                    : starClassName +
                                                      " fill-orange-300"
                                            }
                                            handleClick={() => {
                                                setValue("rating", index, {
                                                    shouldValidate: true,
                                                });
                                                setRating(index);
                                            }}
                                            handleMouseEnter={() =>
                                                setHover(index)
                                            }
                                            handleMouseLeave={() =>
                                                setHover(rating)
                                            }
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-red-800">{errors.rating?.message}</p>
                        <div className="my-5">
                            <label htmlFor="movie-review" className="font-bold">
                                Post your review (optional):
                            </label>
                            <textarea
                                {...register("text")}
                                id="movie-review"
                                name="text"
                                placeholder="Type your review here"
                                className="resize-none border border-gray-700 focus:border-orange-900 p-2 rounded-md"
                                rows={5}
                                cols={70}
                            />
                        </div>
                        {isEditing ? (
                            <div className="flex gap-10">
                                <BaseButton
                                    style="orange"
                                    type="submit"
                                    text="EDIT"
                                />
                                <BaseButton
                                    style="orange"
                                    text="CANCEL"
                                    handleClick={() => setIsEditing(false)}
                                />
                            </div>
                        ) : (
                            <BaseButton
                                style="orange"
                                type="submit"
                                text="SEND"
                            />
                        )}
                    </form>
                )}
                {authData.isAuthenticated && hasRated && !isEditing && (
                    <div className="flex flex-col gap-5">
                        <div>
                            <span className="font-bold">
                                Your rating:{" "}
                                <span className="font-normal">
                                    {displayRating}/10
                                </span>
                            </span>
                        </div>
                        <div>
                            <p className="font-bold">Your review: </p>
                            <p
                                ref={ref}
                                className={!isShowingMore ? "line-clamp-5" : ""}
                            >
                                {displayReview || "N/A"}
                            </p>
                            {isTruncated && (
                                <div>
                                    <p
                                        className="mt-1 text-sky-700 hover:text-green-950 text-base font-medium uppercase cursor-pointer"
                                        onClick={toggleIsShowingMore}
                                    >
                                        {isShowingMore
                                            ? "Show less"
                                            : "Show more"}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-start">
                            <BaseButton
                                text="EDIT YOUR REVIEW"
                                style="orange"
                                handleClick={editUserReview}
                            />
                        </div>
                    </div>
                )}
                {!authData.isAuthenticated && (
                    <p className="px-4 py-2">
                        To rate the movie or post a review, please{" "}
                        <span className="font-semibold">
                            <NavLink to="/login" text="login to your account" />
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};
