import { AuthData, MovieReview } from "../../../lib/entities";
import { MovieReviewCard } from "./MovieReviewCard";

interface MovieReviewsProps {
    movieReviews: MovieReview[];
    authData: AuthData;
}

export const MovieReviews = ({ movieReviews, authData }: MovieReviewsProps) => {
    const userId = authData.user?.id;

    return (
        <div>
            <hr className="h-px mb-5 bg-sky-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {movieReviews.length > 0 &&
                    movieReviews.map((review) => (
                        <MovieReviewCard
                            key={review.id}
                            movieReview={review}
                            userId={userId}
                        />
                    ))}
                {movieReviews.length === 0 && (
                    <div className="flex justify-center italic">
                        No reviews yet
                    </div>
                )}
            </div>
        </div>
    );
};
