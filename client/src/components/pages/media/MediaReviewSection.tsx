import { useLayoutEffect, useRef, useState } from "react";

import type { AuthData } from "../../../lib/entities";
import { BaseLink } from "../../ui/BaseLink";
import { MovieReviewDisplay } from "../movie/MovieReviewDisplay";
import { MovieReviewForm } from "../movie/MovieReviewForm";

interface MediaUserReview {
    rating: number;
    text?: string | null;
}

interface MediaReviewSectionProps {
    userReview?: MediaUserReview | null;
    authData: AuthData;
    mediaLabel: string;
}

export const MediaReviewSection = ({
    userReview,
    authData,
    mediaLabel,
}: MediaReviewSectionProps) => {
    const userRating = userReview?.rating ?? 0;
    const userReviewText = userReview?.text ?? "";

    const [isEditing, setIsEditing] = useState(false);
    const [hasRated, setHasRated] = useState(userRating > 0);
    const [status, setStatus] = useState("");
    const editButtonRef = useRef<HTMLButtonElement>(null);
    const restoreFocus = useRef(false);

    useLayoutEffect(() => {
        if (restoreFocus.current && !isEditing && hasRated) {
            restoreFocus.current = false;
            editButtonRef.current?.focus();
        }
    }, [isEditing, hasRated]);

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <MovieReviewForm
                        mediaLabel={mediaLabel}
                        initialRating={userRating}
                        initialText={userReviewText}
                        hasRated={hasRated}
                        onCancel={() => {
                            restoreFocus.current = true;
                            setIsEditing(false);
                        }}
                        onSuccess={() => {
                            setIsEditing(false);
                            setHasRated(true);
                            restoreFocus.current = true;
                            setStatus("Your review was saved.");
                        }}
                    />
                )}
                {authData.isAuthenticated && hasRated && !isEditing && (
                    <MovieReviewDisplay
                        userRating={userRating}
                        userReview={userReviewText}
                        editButtonRef={editButtonRef}
                        onEdit={() => {
                            setStatus("");
                            setIsEditing(true);
                        }}
                    />
                )}
                {!authData.isAuthenticated && (
                    <p className="px-4 py-2">
                        To rate the {mediaLabel} or post a review, please{" "}
                        <span className="font-semibold">
                            <BaseLink
                                to="/login"
                                state={{ from: location.pathname }}
                            >
                                login to your account
                            </BaseLink>
                        </span>
                    </p>
                )}
            </div>
            <p role="status" aria-atomic="true" className="sr-only">
                {status}
            </p>
        </div>
    );
};
