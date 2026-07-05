import { UserActivity } from "../../../../lib/entities";
import { BaseLink } from "../../../ui/BaseLink";

interface ActivityOtherReviewProps {
    activity: UserActivity;
}

export const ActivityOtherReview = ({ activity }: ActivityOtherReviewProps) => {
    const movieReview = activity.movieReview?.movie
        ? activity.movieReview
        : null;
    const bookReview = activity.bookReview?.book ? activity.bookReview : null;
    const review = movieReview ?? bookReview;
    const media = movieReview?.movie ?? bookReview?.book;
    const mediaId = movieReview?.movieId ?? bookReview?.bookId;
    const mediaUrl = movieReview
        ? `/movies/${mediaId}`
        : `/books/${mediaId}`;
    const mediaLabel = movieReview ? "Movie" : "Book";

    if (!review || !media || !mediaId) return null;

    const reviewLinkText = `${media.title} (${media.releaseYear})`;

    return (
        <div className="mt-2 space-y-1 break-words">
            <p>
                <strong>{mediaLabel}</strong>:{" "}
                <BaseLink to={mediaUrl}>
                    {reviewLinkText}
                </BaseLink>
            </p>
            <p>
                <strong>Rating</strong>: {`${review.rating}/10`}
            </p>
            <p>
                <strong>Review</strong>:{" "}
                {review.text ? (
                    <span>{review.text}</span>
                ) : (
                    <span className="italic">no review</span>
                )}
            </p>
        </div>
    );
};
