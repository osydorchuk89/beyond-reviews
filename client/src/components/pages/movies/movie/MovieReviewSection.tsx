import { useState } from "react";

import {
    AuthData,
    Movie,
    MovieReview,
    MovieReviewInputs,
} from "../../../../lib/entities";
import { useAppDispatch } from "../../../../store/hooks";
import { sendMovieReview } from "../../../../lib/actions";
import { triggerReviewEvent } from "../../../../store";
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
    const initialUserRating =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.rating || 0;
    const initialUserReview =
        movieReviews?.filter((item) => item.userId === authData.user?.id)[0]
            ?.text || "";

    const [isEditing, setIsEditing] = useState(false);
    const [userRating, setUserRating] = useState(initialUserRating);
    const [userReview, setUserReview] = useState(initialUserReview);
    const [hasRated, setHasRated] = useState(userRating > 0);

    const dispatch = useAppDispatch();

    const handleReviewSubmit = async (data: MovieReviewInputs) => {
        const date = new Date();
        const previousRating = userRating;
        const previousReview = userReview;

        try {
            setUserRating(data.rating);
            setUserReview(data.text || "");

            await sendMovieReview(movie.id, authData.user!.id, data);
            dispatch(
                triggerReviewEvent(`new review event at ${date.toString()}`)
            );

            setHasRated(true);
            setIsEditing(false);
        } catch (error) {
            setUserRating(previousRating);
            setUserReview(previousReview);
            console.log(error);
            throw error;
        }
    };

    return (
        <div>
            <div className="bg-sky-200 rounded-lg shadow-lg p-5">
                {authData.isAuthenticated && (!hasRated || isEditing) && (
                    <MovieReviewForm
                        initialRating={userRating}
                        initialText={userReview}
                        isEditing={isEditing}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setIsEditing(false)}
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
                            <NavLink to="/login" text="login to your account" />
                        </span>
                    </p>
                )}
            </div>
        </div>
    );
};
