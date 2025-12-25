import { useState } from "react";

import { AuthData, Movie, MovieReview } from "../../../../lib/entities";
import { NavLink } from "../../../ui/NavLink";
import { MovieReviewForm } from "./MovieReviewForm";
import { MovieReviewDisplay } from "./MovieReviewDisplay";

interface MovieReviewSectionProps {
    movie: Movie;
    movieReviews: MovieReview[];
    authData: AuthData;
}

export const MovieReviewSection = ({
    movie,
    movieReviews,
    authData,
}: MovieReviewSectionProps) => {
    const userRating =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.rating || 0;
    const userReview =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.text || "";

    const [isEditing, setIsEditing] = useState(false);
    const [hasRated, setHasRated] = useState(userRating > 0);

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <MovieReviewForm
                        movieId={movie.id}
                        userId={authData.user?.id ?? ""}
                        initialRating={userRating}
                        initialText={userReview}
                        isEditing={isEditing}
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
                            <NavLink
                                to="/login"
                                state={{ from: location.pathname }}
                            >
                                login to your account
                            </NavLink>
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};
