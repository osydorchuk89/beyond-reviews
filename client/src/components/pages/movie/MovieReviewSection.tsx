import { MovieReview, AuthData } from "../../../lib/entities";
import { MediaReviewSection } from "../media/MediaReviewSection";

interface MovieReviewSectionProps {
    userReview?: MovieReview | null;
    authData: AuthData;
}

export const MovieReviewSection = ({
    userReview,
    authData,
}: MovieReviewSectionProps) => {
    return (
        <MediaReviewSection
            userReview={userReview}
            authData={authData}
            mediaLabel="movie"
            fetcherKey="movie-review"
        />
    );
};
