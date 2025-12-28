import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MovieReviewInputs } from "../../../../lib/entities";
import { ReviewSchema } from "../../../../lib/schemas";
import { StarIcon } from "../../../icons/StarIcon";
import { BaseButton } from "../../../ui/BaseButton";

interface MovieReviewFormProps {
    initialRating?: number;
    initialText?: string;
    hasRated: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export const MovieReviewForm = ({
    initialRating = 0,
    initialText = "",
    hasRated,
    onCancel,
    onSuccess,
}: MovieReviewFormProps) => {
    const [userRating, setUserRating] = useState(initialRating);
    const [hover, setHover] = useState(initialRating);

    const fetcher = useFetcher({ key: "movie-review" });
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
                <BaseButton style="orange" type="submit" disabled={isUpdating}>
                    {isUpdating
                        ? "Please wait..."
                        : hasRated
                        ? "EDIT"
                        : "SUBMIT"}
                </BaseButton>
            </div>
        </fetcher.Form>
    );
};
