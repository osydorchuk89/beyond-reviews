import { useLoaderData } from "react-router";

import { UserMovieReviews } from "../../../../lib/entities";
import { Pagination } from "../../../ui/Pagination";
import { MovieReviewDetails } from "./MovieReviewDetails";

export const UserReviewsPage = () => {
    const { userMovieReviews } = useLoaderData() as {
        userMovieReviews: UserMovieReviews;
    };
    const { reviews, currentPage, totalPages } = userMovieReviews;

    return (
        <div className="flex flex-col gap-6 sm:gap-10 min-h-[70vh] w-full max-w-4xl">
            <p className="text-center text-xl font-bold">Reviews</p>
            {reviews.length ? (
                <>
                    <ul className="flex flex-col gap-4">
                        {reviews.map((review) => (
                            <MovieReviewDetails
                                key={review.id}
                                review={review}
                            />
                        ))}
                    </ul>
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                        />
                    )}
                </>
            ) : (
                <div className="flex items-center justify-center">
                    <p>No movie reviews yet</p>
                </div>
            )}
        </div>
    );
};
