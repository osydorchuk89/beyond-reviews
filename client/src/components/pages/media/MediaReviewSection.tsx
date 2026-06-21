import { useState } from "react";

import { AuthData } from "../../../lib/entities";
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
    fetcherKey: string;
}

export const MediaReviewSection = ({
    userReview,
    authData,
    mediaLabel,
    fetcherKey,
}: MediaReviewSectionProps) => {
    const userRating = userReview?.rating ?? 0;
    const userReviewText = userReview?.text ?? "";

    const [isEditing, setIsEditing] = useState(false);
    const [hasRated, setHasRated] = useState(userRating > 0);

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <MovieReviewForm
                        mediaLabel={mediaLabel}
                        fetcherKey={fetcherKey}
                        initialRating={userRating}
                        initialText={userReviewText}
                        hasRated={hasRated}
                        onCancel={() => setIsEditing(false)}
                        onSuccess={() => {
                            setIsEditing(false);
                            setHasRated(true);
                        }}
                    />
                )}
                {authData.isAuthenticated && hasRated && !isEditing && (
                    <MovieReviewDisplay
                        userRating={userRating}
                        userReview={userReviewText}
                        onEdit={() => setIsEditing(true)}
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
        </div>
    );
};
