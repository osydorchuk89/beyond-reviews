import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MovieReviewInputs } from "../../../../lib/entities";
import { ReviewSchema } from "../../../../lib/schemas";
import { StarIcon } from "../../../icons/StarIcon";
import { BaseButton } from "../../../ui/BaseButton";

interface MovieReviewFormProps {
    movieId: string;
    userId: string;
    initialRating?: number;
    initialText?: string;
    isEditing: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export const MovieReviewForm = ({
    movieId,
    userId,
    initialRating = 0,
    initialText = "",
    onCancel,
    onSuccess,
}: MovieReviewFormProps) => {
    const [userRating, setUserRating] = useState(initialRating);
    const [hover, setHover] = useState(initialRating);

    const fetcher = useFetcher();
    const isUpdating = fetcher.state !== "idle";

    const {
        register,
        setValue,
        formState: { errors },
    } = useForm<MovieReviewInputs>({
        resolver: zodResolver(ReviewSchema),
        defaultValues: {
            rating: initialRating,
            text: initialText,
        },
    });

    useEffect(() => {
        if (fetcher.data?.success) {
            onSuccess();
        }
    }, [fetcher.data, onSuccess]);

    return (
        <fetcher.Form method="post" noValidate>
            <input type="hidden" name="movieId" value={movieId} />
            <input type="hidden" name="userId" value={userId} />

            <label htmlFor="ratng" className="font-bold">
                Rate the movie:
            </label>
            <input id="rating" type="hidden" name="rating" value={userRating} />
            <div className="flex">
                {[...Array(10).keys()].map((index) => {
                    index += 1;
                    return (
                        <div key={index}>
                            <StarIcon
                                className={`w-8 h-8 border-none hover:cursor-pointer ${
                                    index <= (hover || userRating)
                                        ? "fill-orange-500"
                                        : "fill-orange-300"
                                }`}
                                handleClick={() => {
                                    setValue("rating", index, {
                                        shouldValidate: true,
                                    });
                                    setUserRating(index);
                                }}
                                handleMouseEnter={() => setHover(index)}
                                handleMouseLeave={() => setHover(userRating)}
                            />
                        </div>
                    );
                })}
            </div>
            <p className="text-red-800">{errors.rating?.message}</p>

            <div className="my-5">
                <label htmlFor="review" className="font-bold">
                    Post your review (optional):
                </label>
                <textarea
                    {...register("text")}
                    id="review"
                    name="text"
                    placeholder="Type your review here"
                    className="resize-none border border-gray-700 focus:border-orange-900 p-2 rounded-md"
                    rows={5}
                    cols={70}
                />
            </div>

            <div className="flex gap-10">
                <BaseButton style="sky" handleClick={onCancel}>
                    CANCEL
                </BaseButton>
                <BaseButton style="orange" type="submit">
                    {isUpdating ? "Please wait..." : "EDIT"}
                </BaseButton>
            </div>
        </fetcher.Form>
    );
};
