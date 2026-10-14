import { useEffect, useId, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { MovieReviewInputs } from "../../../lib/entities";
import { ReviewSchema } from "../../../lib/schemas";
import { StarIcon } from "../../icons/StarIcon";
import { BaseButton } from "../../ui/BaseButton";

interface MovieReviewFormProps {
    mediaLabel?: string;
    initialRating?: number;
    initialText?: string;
    hasRated: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export const MovieReviewForm = ({
    mediaLabel = "movie",
    initialRating = 0,
    initialText = "",
    hasRated,
    onCancel,
    onSuccess,
}: MovieReviewFormProps) => {
    const id = useId();
    const formRef = useRef<HTMLFormElement>(null);
    const saveRef = useRef<HTMLButtonElement>(null);
    const submitted = useRef(false);
    // Each form owns its request; reopening an edit must not reuse old success data.
    const fetcher = useFetcher<{ success?: boolean; error?: string }>();
    const isUpdating = fetcher.state !== "idle";
    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        control,
        formState: { errors },
    } = useForm<MovieReviewInputs>({
        resolver: zodResolver(ReviewSchema),
        defaultValues: { rating: initialRating, text: initialText },
    });
    const { field: ratingField } = useController({ name: "rating", control });
    const userRating = ratingField.value;
    const [hover, setHover] = useState(0);

    useEffect(() => {
        if (!hasRated) return;
        formRef.current
            ?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
            ?.focus();
    }, [hasRated]);

    useEffect(() => {
        if (fetcher.state !== "idle") return;
        submitted.current = false;
        if (fetcher.data?.success) onSuccess();
    }, [fetcher.state, fetcher.data, onSuccess]);

    const onSubmit = (data: MovieReviewInputs) => {
        if (submitted.current || isUpdating) return;
        submitted.current = true;
        // Keep focus available even when submitting from a rating input.
        saveRef.current?.focus();
        fetcher.submit(
            { rating: String(data.rating), text: data.text ?? "" },
            { method: "post" },
        );
    };

    return (
        <div>
            <fetcher.Form
                ref={formRef}
                method="post"
                noValidate
                aria-label={`Your ${mediaLabel} review`}
                aria-busy={isUpdating}
                onSubmit={handleSubmit(onSubmit)}
            >
                <fieldset
                    disabled={isUpdating}
                    aria-describedby={`${id}-rating-hint`}
                    className="min-w-0"
                >
                    <legend className="font-bold">
                        Rate the {mediaLabel}:
                    </legend>
                    <p id={`${id}-rating-hint`} className="sr-only">
                        Choose a rating from 1 (lowest) to 10 (highest).
                    </p>
                    <div className="flex">
                        {Array.from(
                            { length: 10 },
                            (_, index) => index + 1,
                        ).map((rating) => (
                            <div key={rating}>
                                <label
                                    className="rating-choice relative inline-block h-8 w-8 cursor-pointer"
                                    onMouseEnter={() => {
                                        if (!isUpdating) setHover(rating);
                                    }}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <input
                                        name={ratingField.name}
                                        ref={
                                            rating === (initialRating || 1)
                                                ? ratingField.ref
                                                : undefined
                                        }
                                        checked={userRating === rating}
                                        onChange={() =>
                                            ratingField.onChange(rating)
                                        }
                                        onBlur={ratingField.onBlur}
                                        onKeyDown={() => setHover(0)}
                                        type="radio"
                                        value={rating}
                                        aria-label={`${rating} out of 10`}
                                        aria-invalid={Boolean(errors.rating)}
                                        aria-describedby={`${id}-rating-hint${errors.rating ? ` ${id}-rating-error` : ""}`}
                                        className="absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                                    />
                                    <span className="pointer-events-none">
                                        <StarIcon
                                            className={`w-8 h-8 border-none hover:cursor-pointer ${rating <= (hover || userRating) ? "fill-orange-500" : "fill-orange-300"}`}
                                        />
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>
                <p className="sr-only">
                    Selected rating:{" "}
                    {userRating > 0 ? `${userRating} out of 10` : "None"}
                </p>
                <p
                    id={`${id}-rating-error`}
                    role={errors.rating ? "alert" : undefined}
                    className="text-red-800"
                >
                    {errors.rating?.message}
                </p>
                <div className="flex flex-col my-5">
                    <label htmlFor={`${id}-review`} className="font-bold">
                        Post your review (optional):
                    </label>
                    <textarea
                        {...register("text")}
                        id={`${id}-review`}
                        placeholder="Type your review here"
                        className="resize-none border border-gray-700 focus:border-orange-900 p-2 rounded-md"
                        rows={5}
                        cols={70}
                        readOnly={isUpdating}
                        aria-invalid={Boolean(errors.text)}
                        aria-describedby={
                            errors.text ? `${id}-text-error` : undefined
                        }
                    />
                    {errors.text && (
                        <p
                            id={`${id}-text-error`}
                            role="alert"
                            className="text-red-800"
                        >
                            {errors.text.message}
                        </p>
                    )}
                </div>
                {!isUpdating && fetcher.data?.error && (
                    <p role="alert" className="text-red-800 mb-3">
                        {fetcher.data.error} Your draft has been kept. Please
                        try saving again.
                    </p>
                )}
                <div className="flex gap-10">
                    <BaseButton
                        style="sky"
                        type="button"
                        aria-disabled={isUpdating}
                        handleClick={() => {
                            if (isUpdating) return;
                            reset();
                            setHover(0);
                            setFocus("rating");
                            onCancel();
                        }}
                    >
                        CANCEL
                    </BaseButton>
                    <BaseButton
                        ref={saveRef}
                        style="orange"
                        type="submit"
                        aria-disabled={isUpdating}
                    >
                        {isUpdating
                            ? "Please wait..."
                            : hasRated
                              ? "EDIT"
                              : "SUBMIT"}
                    </BaseButton>
                </div>
            </fetcher.Form>
            <p role="status" aria-atomic="true" className="sr-only">
                {isUpdating ? "Saving your review…" : ""}
            </p>
        </div>
    );
};
