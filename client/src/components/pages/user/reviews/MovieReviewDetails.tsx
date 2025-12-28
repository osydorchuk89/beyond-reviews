import { Link } from "react-router";

import { MovieReview } from "../../../../lib/entities";

interface MovieReviewDetailsProps {
    review: MovieReview;
}

export const MovieReviewDetails = ({ review }: MovieReviewDetailsProps) => {
    return (
        <div className="flex bg-sky-100 rounded-lg shadow-lg p-5 gap-8">
            <div className="w-1/4 flex flex-col items-center gap-4">
                <Link
                    to={`/movies/${review.movieId}`}
                    className="hover:underline"
                >
                    <p className="font-bold text-lg text-center">
                        {review.movie.title} ({review.movie.releaseYear})
                    </p>
                </Link>
                <Link to={`/movies/${review.movieId}`}>
                    <img
                        width={150}
                        src={review.movie.poster}
                        className="rounded-lg "
                    />
                </Link>
            </div>
            <div className="w-3/4 flex flex-col gap-2">
                <p className="self-start">
                    <span className="font-semibold">Rating:</span>{" "}
                    {review.rating}
                    /10
                </p>
                <p className="self-start">
                    <span className="font-semibold">Review:</span>{" "}
                    {review.text ?? <span className="italic">no review</span>}
                </p>
            </div>
        </div>
    );
};
