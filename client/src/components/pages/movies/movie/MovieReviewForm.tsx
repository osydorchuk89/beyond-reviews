import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { MovieReviewInputs } from "../../../../lib/entities";
import { ReviewSchema } from "../../../../lib/schemas";
import { StarIcon } from "../../../icons/StarIcon";
import { BaseButton } from "../../../ui/BaseButton";

interface MovieReviewFormProps {
    initialRating?: number;
    initialText?: string;
    isEditing: boolean;
    onSubmit: (data: MovieReviewInputs) => Promise<void>;
    onCancel: () => void;
}

export const MovieReviewForm = ({
    initialRating = 0,
    initialText = "",
    isEditing,
    onSubmit,
    onCancel,
}: MovieReviewFormProps) => {
    const [userRating, setUserRating] = useState(initialRating);
    const [hover, setHover] = useState(initialRating);

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<MovieReviewInputs>({
        resolver: zodResolver(ReviewSchema),
        defaultValues: {
            rating: initialRating,
            text: initialText,
        },
    });

    const handleFormSubmit = handleSubmit(async (data) => {
        await onSubmit(data);
        if (!isEditing) {
            reset();
            setUserRating(0);
            setHover(0);
        }
    });

    const starClassName = "w-8 h-8 border-none hover:cursor-pointer";

    return (
        <form noValidate onSubmit={handleFormSubmit}>
            <p className="font-bold">Rate the movie:</p>
            <div className="flex">
                {[...Array(10).keys()].map((index) => {
                    index += 1;
                    return (
                        <div key={index}>
                            <StarIcon
                                className={
                                    index <= (hover || userRating)
                                        ? starClassName + " fill-orange-500"
                                        : starClassName + " fill-orange-300"
                                }
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
                    <BaseButton style="orange" type="submit">
                        EDIT
                    </BaseButton>
                    <BaseButton style="orange" handleClick={onCancel}>
                        CANCEL
                    </BaseButton>
                </div>
            ) : (
                <BaseButton style="orange" type="submit">
                    SEND
                </BaseButton>
            )}
        </form>
    );
};
