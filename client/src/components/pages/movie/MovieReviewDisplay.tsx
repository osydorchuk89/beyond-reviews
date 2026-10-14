import { useRef, type Ref, type RefObject } from "react";

import { useTruncatedElement } from "../../../hooks/useTruncatedElements";
import { BaseButton } from "../../ui/BaseButton";

interface MovieReviewDisplayProps {
    userRating: number;
    userReview: string;
    onEdit: () => void;
    editButtonRef?: Ref<HTMLButtonElement>;
}

export const MovieReviewDisplay = ({
    userRating,
    userReview,
    onEdit,
    editButtonRef,
}: MovieReviewDisplayProps) => {
    const ref = useRef<HTMLParagraphElement>(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({ ref: ref as RefObject<HTMLParagraphElement> });

    return (
        <div className="flex flex-col gap-5">
            <div>
                <span className="font-bold">
                    Your rating:{" "}
                    <span className="font-normal">{userRating}/10</span>
                </span>
            </div>
            <div>
                <p className="font-bold">Your review: </p>
                <p ref={ref} className={isShowingMore ? "" : "line-clamp-5"}>
                    {userReview ?? "N/A"}
                </p>
                {isTruncated && (
                    <div>
                        <button
                            type="button"
                            className="mt-1 text-sky-700 hover:text-green-950 text-base font-medium uppercase cursor-pointer"
                            onClick={toggleIsShowingMore}
                        >
                            {isShowingMore ? "Show less" : "Show more"}
                        </button>
                    </div>
                )}
            </div>
            <div className="flex justify-start">
                <BaseButton
                    ref={editButtonRef}
                    style="orange"
                    handleClick={onEdit}
                >
                    EDIT YOUR REVIEW
                </BaseButton>
            </div>
        </div>
    );
};
