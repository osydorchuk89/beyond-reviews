import { UserActivity } from "../../../lib/entities";
import { NavLink } from "../../ui/NavLink";

interface ActivityDetailsProps {
    activity: UserActivity;
    ratingUserName: string;
    parsedDate: string;
}

export const ActivityDetails = ({
    activity,
    ratingUserName,
    parsedDate,
}: ActivityDetailsProps) => {
    return (
        <>
            <div className="flex justify-between">
                <p className="flex items-center">
                    <img
                        src={activity.user.photo}
                        className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                    />
                    {activity.movieId && activity.action === "rated" && (
                        <span className="font-bold">
                            You rated {activity.reviewRating}/10{" "}
                            <NavLink
                                text={`${activity.movie.title} (${activity.movie.releaseYear})`}
                                to={`/movies/${activity.movieId}`}
                            />
                        </span>
                    )}
                    {activity.movieId && activity.action !== "rated" && (
                        <span className="font-bold">
                            You{" "}
                            {activity.action === "saved" ? "added" : "removed"}{" "}
                            <NavLink
                                text={`${activity.movie.title} (${activity.movie.releaseYear})`}
                                to={`/movies/${activity.movieId}`}
                            />{" "}
                            {activity.action === "saved" ? "to" : "from"} watch
                            list
                        </span>
                    )}
                    {activity.movieReviewId && (
                        <span className="font-bold">
                            You{" "}
                            {activity.action === "liked" ? "liked" : "unliked"}{" "}
                            a review by{" "}
                            <NavLink
                                text={ratingUserName}
                                // to={`/users/${ratingUserId}/profile`}
                                to="#"
                            />
                        </span>
                    )}
                </p>
                <p>
                    <span className="italic">{parsedDate}</span>
                </p>
            </div>
            {activity.movieId && activity.reviewText && (
                <p className="mt-2">
                    <strong>Review</strong>: {activity.reviewText}
                </p>
            )}
            {activity.movieId &&
                activity.action === "rated" &&
                !activity.reviewText && (
                    <p className="italic mt-2">No review</p>
                )}
        </>
    );
};
