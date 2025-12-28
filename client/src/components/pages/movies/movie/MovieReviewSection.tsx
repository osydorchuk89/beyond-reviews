import { useState } from "react";

import { AuthData, MovieReview } from "../../../../lib/entities";
import { BaseLink } from "../../../ui/BaseLink";
import { MovieReviewForm } from "./MovieReviewForm";
import { MovieReviewDisplay } from "./MovieReviewDisplay";

interface MovieReviewSectionProps {
    movieReviews: MovieReview[];
    authData: AuthData;
}

export const MovieReviewSection = ({
    movieReviews,
    authData,
}: MovieReviewSectionProps) => {
    const userRating =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.rating ?? 0;
    const userReview =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.text ?? "";

    const [isEditing, setIsEditing] = useState(false);
    const [hasRated, setHasRated] = useState(userRating > 0);

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <MovieReviewForm
                        initialRating={userRating}
                        initialText={userReview}
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
                        userReview={userReview}
                        onEdit={() => setIsEditing(true)}
                    />
                )}
                {!authData.isAuthenticated && (
                    <p className="px-4 py-2">
                        To rate the movie or post a review, please{" "}
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
