import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieReview, User } from "../../../../lib/entities";
import { useAuthData } from "../../../../hooks/useAuthData";
import { LoadingSpinner } from "../../../ui/LoadingSpinner";
import { MovieReviewDetails } from "./MovieReviewDetails";
import { useUserIdentity } from "../../../../hooks/useUserIdentity";

export const UserReviews = () => {
    const { user } = useRouteLoaderData("userProfile") as { user: User };

    const { userMovieReviews } = useLoaderData() as {
        userMovieReviews: MovieReview[];
    };

    const { authDataFetching } = useAuthData();

    const { isSameUser, userName } = useUserIdentity(user);

    if (authDataFetching) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <p className="text-center text-2xl font-bold">
                {isSameUser ? "Your" : `${userName}'s`} movie reviews
            </p>
            {userMovieReviews.length ? (
                <ul className="flex flex-col gap-4">
                    {userMovieReviews.map((review) => (
                        <MovieReviewDetails key={review.id} review={review} />
                    ))}
                </ul>
            ) : (
                <p>No movie reviews yet</p>
            )}
        </div>
    );
};
