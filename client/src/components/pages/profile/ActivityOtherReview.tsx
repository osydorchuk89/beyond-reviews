import { UserActivity } from "../../../lib/entities";
import { NavLink } from "../../ui/NavLink";

export const ActivityOtherReview = ({
    activity,
}: {
    activity: UserActivity;
}) => {
    return (
        <div className="mt-2">
            <p>
                <strong>Movie</strong>:{" "}
                <NavLink
                    text={`${activity.movieReview.movie.title} (${activity.movieReview.movie.releaseYear})`}
                    to={`/movies/${activity.movieReview.movieId}`}
                />
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
