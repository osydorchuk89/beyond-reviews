import axios from "axios";
import { useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { dialogActions } from "../store";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getMovie, queryClient } from "../lib/requests";
import { useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { UserRatingSchema } from "../lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./Button";
import { DarkLink } from "./DarkLink";
import { StarIcon } from "./StarIcon";
import { useTruncatedElement } from "../hooks/useTuncatedElement";
import { LoadingSpinner } from "./LoadingSpinner";
import { BASE_API_URL } from "../lib/urls";
import { MovieRating, User } from "../lib/types";

interface RatingInputs {
    movieRating: number;
    movieReview?: string;
}

export const MovieRatingForm = () => {
    const { isAuthenticated, userData } = useAppSelector((state) => state.auth);
    const userId = userData?._id;
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data, isFetching, refetch } = useQuery({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
        enabled: false,
    });

    const dispatch = useAppDispatch();

    const movieRatings = data.ratings as MovieRating[];
    const userRating =
        movieRatings.filter((item) => {
            const userItem = item.userId as User;
            return userItem._id === userId;
        })[0]?.movieRating || 0;
    const userReview =
        movieRatings.filter((item) => {
            const userItem = item.userId as User;
            return userItem._id === userId;
        })[0]?.movieReview || "";

    const [isEditing, setIsEditing] = useState(false);
    const [rating, setRating] = useState(userRating);
    const [hover, setHover] = useState(userRating);
    const [hasRated, setHasRated] = useState(userRating > 0 ? true : false);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<RatingInputs>({
        resolver: zodResolver(UserRatingSchema),
    });

    const sendUserRatingData = async (data: RatingInputs) => {
        try {
            const date = new Date();
            await axios({
                method: "post",
                url: BASE_API_URL + "movies/" + movieId + "/ratings",
                withCredentials: true,
                data: { ...data, userId: userData!._id, date },
            });
            setHasRated(true);
            setIsEditing(false);
            dispatch(dialogActions.open());
            refetch();
            queryClient.invalidateQueries({
                queryKey: ["movie", "ratings", { movieId: movieId }],
            });
        } catch (error: any) {
            console.log(error);
        }
    };

    const editUserRating = async () => {
        setValue("movieRating", userRating, {
            shouldValidate: true,
        });
        setValue("movieReview", userReview, {
            shouldValidate: true,
        });
        setIsEditing(true);
    };

    const { mutate } = useMutation({
        mutationFn: sendUserRatingData,
    });

    let starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    const ref = useRef(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({
            ref,
        });

    return (
        <div>
            {isFetching && (
                <div className="flex justify-center">
                    <LoadingSpinner />
                </div>
            )}
            {!isFetching && (
                <div className="bg-amber-100 rounded-lg shadow-lg p-5">
                    {isAuthenticated && (!hasRated || isEditing) && (
                        <form
                            noValidate
                            onSubmit={handleSubmit((data) => {
                                mutate(data);
                                reset();
                            })}
                        >
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
                                                          " fill-amber-500"
                                                        : starClassName +
                                                          " fill-amber-200"
                                                }
                                                handleClick={() => {
                                                    setValue(
                                                        "movieRating",
                                                        index,
                                                        {
                                                            shouldValidate:
                                                                true,
                                                        }
                                                    );
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
                            <p className="text-red-800">
                                {errors.movieRating?.message}
                            </p>
                            <div className="my-5">
                                <label
                                    htmlFor="movie-review"
                                    className="font-bold"
                                >
                                    Post your review (optional):
                                </label>
                                <textarea
                                    {...register("movieReview")}
                                    id="movie-review"
                                    name="movieReview"
                                    placeholder="Type your review here"
                                    className="resize-none border border-gray-700 focus:border-amber-900 p-2 rounded-md"
                                    rows={5}
                                    cols={70}
                                />
                            </div>
                            {isEditing ? (
                                <div className="flex gap-10">
                                    <Button
                                        style="dark"
                                        type="submit"
                                        text="EDIT"
                                    />
                                    <Button
                                        style="dark"
                                        text="CANCEL"
                                        handleClick={() => setIsEditing(false)}
                                    />
                                </div>
                            ) : (
                                <Button
                                    style="dark"
                                    type="submit"
                                    text="RATE"
                                />
                            )}
                        </form>
                    )}
                    {isAuthenticated && hasRated && !isEditing && (
                        <div className="flex flex-col gap-5">
                            <div>
                                <span className="font-bold">
                                    Your rating:{" "}
                                    <span className="font-normal">
                                        {userRating}/10
                                    </span>
                                </span>
                            </div>
                            <div>
                                {" "}
                                <p className="font-bold">Your review: </p>
                                <p
                                    ref={ref}
                                    className={
                                        !isShowingMore ? "line-clamp-5" : ""
                                    }
                                >
                                    {userReview || "N/A"}
                                </p>
                                {isTruncated && (
                                    <div>
                                        <Button
                                            style="mt-1 text-green-700 hover:text-green-950 text-base font-medium uppercase"
                                            text={
                                                isShowingMore
                                                    ? "Show less"
                                                    : "Show more"
                                            }
                                            handleClick={toggleIsShowingMore}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-start">
                                <Button
                                    text="EDIT YOUR RATING"
                                    style="dark"
                                    handleClick={editUserRating}
                                />
                            </div>
                        </div>
                    )}
                    {!isAuthenticated && (
                        <p className="px-4 py-2 bg-amber-100 rounded-md">
                            To rate the movie or post a review, please{" "}
                            <DarkLink
                                to="/login"
                                text="login to your account"
                            ></DarkLink>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
