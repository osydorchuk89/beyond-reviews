import { getBookReviews, sendBookLikeOrUnlike } from "../../../lib/api";
import { BookReview, BookReviewsData } from "../../../lib/entities";
import { MediaReviews } from "../media/MediaReviews";

interface BookReviewsProps {
    bookId: string;
    initialBookReviewsData: BookReviewsData;
}

export const BookReviews = ({
    bookId,
    initialBookReviewsData,
}: BookReviewsProps) => {
    return (
        <MediaReviews<BookReview, BookReviewsData>
            mediaId={bookId}
            initialReviewsData={initialBookReviewsData}
            getReviews={(id, page, limit) => getBookReviews(id, page, limit)}
            likeOrUnlikeReview={sendBookLikeOrUnlike}
            fetchErrorMessage="Failed to fetch book reviews:"
        />
    );
};
