import { Link } from "react-router";

import { MovieReview } from "../../../../lib/entities";
import { getMoviePoster } from "../../../../lib/utils";

interface MovieReviewDetailsProps {
    review: MovieReview;
}

export const MovieReviewDetails = ({ review }: MovieReviewDetailsProps) => {
    const moviePoster = getMoviePoster(review.movie.poster);
    return (
        <div className="flex flex-col sm:flex-row bg-sky-100 rounded-lg shadow-lg p-4 sm:p-5 gap-6 sm:gap-8">
            <div className="w-full sm:w-1/4 flex flex-col items-center gap-4">
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
                        src={moviePoster}
                        className="rounded-lg w-36 sm:w-32 md:w-36"
                        alt="movie poster"
                    />
                </Link>
            </div>
            <div className="w-full sm:w-3/4 flex flex-col gap-2 break-words">
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
