import axios from "axios";
import { useAppSelector } from "../store/hooks";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../lib/requests";
import { useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { UserRatingSchema } from "../lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { getUserRating } from "../lib/requests";
import { DarkButton } from "./DarkButton";
import { DarkLink } from "./DarkLink";
import { StarIcon } from "./StarIcon";
import { LoadingSpinner } from "./LoadingSpinner";
import { BASE_API_URL } from "../lib/urls";

interface RatingInputs {
    movieRating: number;
    movieReview?: string;
}

export const MovieRatingForm = () => {
    const authData = useAppSelector((state) => state.auth);
    const { movieId } = useParams({ strict: false }) as { movieId: string };

    const [isEditing, setIsEditing] = useState(false);

    const { data, isFetching } = useQuery({
        queryKey: ["movie", "userRating", { authData }],
        queryFn: () => getUserRating(authData, movieId),
        staleTime: 60000,
    });

    const [rating, setRating] = useState(data?.movieRating || 0);
    const [hover, setHover] = useState(data?.movieRating || 0);
    const [hasRated, setHasRated] = useState(data ? true : false);

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
            await axios({
                method: "post",
                url: BASE_API_URL + "movies/" + movieId + "/ratings",
                withCredentials: true,
                data: { ...data, userId: authData.userData!._id },
            });
            setHasRated(true);
            setIsEditing(false);
        } catch (error: any) {
            console.log(error);
        }
    };

    const editUserRating = async () => {
        setValue("movieRating", data.movieRating, {
            shouldValidate: true,
        });
        setValue("movieReview", data.movieReview, {
            shouldValidate: true,
        });
        setIsEditing(true);
    };

    const { mutate } = useMutation({
        mutationFn: sendUserRatingData,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["movie"] }),
    });

    let starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    console.log(hasRated);

    return (
        <div>
            {isFetching && (
                <div className="flex justify-center">
                    <LoadingSpinner />
                </div>
            )}
            {!isFetching && (
                <div>
                    {authData.isAuthenticated && (!hasRated || isEditing) && (
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
                            <DarkButton type="submit" text="RATE" />
                        </form>
                    )}
                    {authData.isAuthenticated && hasRated && !isEditing && (
                        <div className="flex flex-col gap-5">
                            <p>
                                <span className="font-bold">Your rating: </span>
                                {data.movieRating}/10
                            </p>
                            <p>
                                {" "}
                                <span className="font-bold">Your review: </span>
                                {data.movieReview}
                            </p>
                            <div className="flex justify-start">
                                <DarkButton
                                    text="EDIT YOUR RATING"
                                    handleClick={editUserRating}
                                />
                            </div>
                        </div>
                    )}
                    {!authData.isAuthenticated && (
                        <p className="px-4 py-2 bg-amber-100 rounded-md">
                            To rate the movie or post a review, please{" "}
                            <DarkLink
                                to="/login"
                                text="login to your account"
                            ></DarkLink>
                            .
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
