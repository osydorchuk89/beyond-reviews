import { AuthData, BookReview } from "../../../lib/entities";
import { MediaReviewSection } from "../media/MediaReviewSection";

interface BookReviewSectionProps {
    userReview?: BookReview | null;
    authData: AuthData;
}

export const BookReviewSection = ({
    userReview,
    authData,
}: BookReviewSectionProps) => {
    return (
        <MediaReviewSection
            userReview={userReview}
            authData={authData}
            mediaLabel="book"
            fetcherKey="book-review"
        />
    );
};
