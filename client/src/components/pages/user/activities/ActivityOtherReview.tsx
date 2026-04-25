import { UserActivity } from "../../../../lib/entities";
import { BaseLink } from "../../../ui/BaseLink";

interface ActivityOtherReviewProps {
    activity: UserActivity;
}

export const ActivityOtherReview = ({ activity }: ActivityOtherReviewProps) => {
    const movieReviewLinkText = `${activity.movieReview.movie.title} (${activity.movieReview.movie.releaseYear})`;

    return (
        <div className="mt-2 space-y-1 break-words">
            <p>
                <strong>Movie</strong>:{" "}
                <BaseLink to={`/movies/${activity.movieReview.movieId}`}>
                    {movieReviewLinkText}
                </BaseLink>
            </p>
            <p>
                <strong>Rating</strong>: {`${activity.movieReview.rating}/10`}
            </p>
            <p>
                <strong>Review</strong>:{" "}
                {activity.movieReview.text ? (
                    <span>{activity.movieReview.text}</span>
                ) : (
                    <span className="italic">no review</span>
                )}
            </p>
        </div>
    );
};
