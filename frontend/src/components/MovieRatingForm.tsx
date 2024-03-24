import axios from "axios";
import { useAppSelector } from "../store/hooks";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { UserRatingSchema } from "../lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { DarkButton } from "./DarkButton";
import { DarkLink } from "./DarkLink";
import { StarIcon } from "./StarIcon";
import { BASE_API_URL } from "../lib/urls";

interface RatingInputs {
    movieRating: number;
    movieReview?: string;
}

export const MovieRatingForm = () => {
    const authData = useAppSelector((state) => state.auth);
    const { movieId } = useParams({ strict: false });

    const getUserRating = async () => {
        if (authData.userData) {
            try {
                const response = await axios({
                    method: "get",
                    url: BASE_API_URL + "movies/" + movieId + "/ratings",
                    withCredentials: true,
                    params: {
                        userId: authData.userData._id,
                    },
                });
                return response.data;
            } catch (error) {
                console.log(error);
            }
        } else {
            return null;
        }
    };

    const query = useQuery({
        queryKey: ["user-rating"],
        queryFn: getUserRating,
    });

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
        console.log(movieId);
        try {
            await axios({
                method: "post",
                url: BASE_API_URL + "movies/" + movieId + "/ratings",
                withCredentials: true,
                data: { ...data, userId: authData.userData!._id },
            });
            console.log("succesfully posted rating");
        } catch (error: any) {
            console.log(error);
        }
    };

    const { mutate } = useMutation({
        mutationFn: sendUserRatingData,
    });

    const initialRating = query.data?.movieRating || 0;

    const [rating, setRating] = useState(initialRating);
    const [hover, setHover] = useState(initialRating);

    let starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    return (
        <div>
            {authData.isAuthenticated ? (
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
                                            setValue("movieRating", index, {
                                                shouldValidate: true,
                                            });
                                            setRating(index);
                                        }}
                                        handleMouseEnter={() => setHover(index)}
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
                        <label htmlFor="movie-review" className="font-bold">
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
            ) : (
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
    );
};
