import { UserActivity } from "../../../../lib/entities";
import { NavLink } from "../../../ui/NavLink";

interface ActivityOtherReviewProps {
    activity: UserActivity;
}

export const ActivityOtherReview = ({ activity }: ActivityOtherReviewProps) => {
    const movieReviewLinkText = `${activity.movieReview.movie.title} (${activity.movieReview.movie.releaseYear})`;

    return (
        <div className="mt-2">
            <p>
                <strong>Movie</strong>:{" "}
                <NavLink to={`/movies/${activity.movieReview.movieId}`}>
                    {movieReviewLinkText}
                </NavLink>
            </p>
            <p>
                <strong>Rating</strong>: {`${activity.movieReview.rating}/10`}
            </p>
            <p>
                <strong>Review</strong>:{" "}
                {activity.movieReview.text ? (
                    <span className="w-full">{activity.movieReview.text}</span>
                ) : (
                    <span className="italic">no review</span>
                )}
            </p>
        </div>
    );
};
