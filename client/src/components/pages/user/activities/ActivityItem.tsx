import { UserActivity } from "../../../../lib/entities";
import { ActivityDetails } from "./ActivityDetails";
import { ActivityOtherReview } from "./ActivityOtherReview";

interface ActivityDetailsProps {
    activity: UserActivity;
}

export const ActivityItem = ({ activity }: ActivityDetailsProps) => {
    const ratingUser = activity.movieReview?.user;
    const ratingUserId = ratingUser?.id ?? "";
    const ratingUserName = ratingUser
        ? `${ratingUser.firstName} ${ratingUser.lastName}`
        : "";

    const activityDate = new Date(activity.date);
    const parsedDate = activityDate.toLocaleString("default", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
    });

    if (!activity.movie) {
        return (
            <div className="p-5 rounded-lg shadow-lg bg-sky-100">
                <p className="text-center italic">Missing data</p>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-lg shadow-lg bg-sky-100">
            <ActivityDetails
                activity={activity}
                ratingUserName={ratingUserName}
                ratingUserId={ratingUserId}
                parsedDate={parsedDate}
            />
            {activity.movieReviewId && (
                <ActivityOtherReview activity={activity} />
            )}
        </div>
    );
};
