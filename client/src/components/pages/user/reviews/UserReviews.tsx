import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieReview, User } from "../../../../lib/entities";
import { MovieReviewDetails } from "./MovieReviewDetails";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";

export const UserReviews = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userMovieReviews } = useLoaderData() as {
        userMovieReviews: MovieReview[];
    };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <p className="text-center text-2xl font-bold">
                {isSameUser ? "Your" : `${profileUserName}'s`} movie reviews
            </p>
            {userMovieReviews.length ? (
                <ul className="flex flex-col gap-4">
                    {userMovieReviews.map((review) => (
                        <MovieReviewDetails key={review.id} review={review} />
                    ))}
                </ul>
            ) : (
                <div className="flex items-center justify-center">
                    <p>No movie reviews yet</p>
                </div>
            )}
        </div>
    );
};
