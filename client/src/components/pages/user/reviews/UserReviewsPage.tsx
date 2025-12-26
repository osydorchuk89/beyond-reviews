import { useLoaderData } from "react-router";

import { MovieReview } from "../../../../lib/entities";
import { MovieReviewDetails } from "./MovieReviewDetails";

export const UserReviewsPage = () => {
    const { userMovieReviews } = useLoaderData() as {
        userMovieReviews: MovieReview[];
    };

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <p className="text-center text-xl font-bold">Reviews</p>
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
