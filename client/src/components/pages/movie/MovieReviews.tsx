import { getMovieReviews, sendLikeOrUnlike } from "../../../lib/api";
import { MovieReview, MovieReviewsData } from "../../../lib/entities";
import { MediaReviews } from "../media/MediaReviews";

interface MovieReviewsProps {
    movieId: string;
    initialMovieReviewsData: MovieReviewsData;
}

export const MovieReviews = ({
    movieId,
    initialMovieReviewsData,
}: MovieReviewsProps) => {
    return (
        <MediaReviews<MovieReview, MovieReviewsData>
            mediaId={movieId}
            initialReviewsData={initialMovieReviewsData}
            getReviews={(id, page, limit) => getMovieReviews(id, page, limit)}
            likeOrUnlikeReview={sendLikeOrUnlike}
            fetchErrorMessage="Failed to fetch movie reviews:"
        />
    );
};
