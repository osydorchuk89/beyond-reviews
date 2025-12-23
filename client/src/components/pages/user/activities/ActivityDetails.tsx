import { UserActivity } from "../../../../lib/entities";
import { NavLink } from "../../../ui/NavLink";

interface ActivityDetailsProps {
    activity: UserActivity;
    userName: string;
    ratingUserName: string;
    ratingUserId: string;
    parsedDate: string;
    isSameUser: boolean;
}

export const ActivityDetails = ({
    activity,
    userName,
    ratingUserName,
    ratingUserId,
    parsedDate,
    isSameUser,
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
                            {isSameUser ? "You" : userName} rated{" "}
                            {activity.reviewRating}/10{" "}
                            <NavLink
                                to={`/movies/${activity.movieId}`}
                            >{`${activity.movie.title} (${activity.movie.releaseYear})`}</NavLink>
                        </span>
                    )}
                    {activity.movieId && activity.action !== "rated" && (
                        <span className="font-bold">
                            {isSameUser ? "You" : userName}{" "}
                            {activity.action === "saved" ? "added" : "removed"}{" "}
                            <NavLink
                                to={`/movies/${activity.movieId}`}
                            >{`${activity.movie.title} (${activity.movie.releaseYear})`}</NavLink>{" "}
                            {activity.action === "saved" ? "to" : "from"} watch
                            list
                        </span>
                    )}
                    {activity.movieReviewId && (
                        <span className="font-bold">
                            {isSameUser ? "You" : userName}{" "}
                            {activity.action === "liked" ? "liked" : "unliked"}{" "}
                            a review by{" "}
                            <NavLink to={`/users/${ratingUserId}/profile`}>
                                {ratingUserName}
                            </NavLink>
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
