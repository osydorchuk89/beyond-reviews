import { useLoaderData, useRouteLoaderData } from "react-router";

import { User, UserActivity } from "../../../../lib/entities";
import { ActivityDetails } from "./ActivityDetails";
import { ActivityOtherReview } from "./ActivityOtherReview";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { ButtonLink } from "../../../ui/ButtonLink";

export const UserActivities = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userActivities } = useLoaderData() as {
        userActivities: UserActivity[];
    };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    const reversedActivityData = [...userActivities].reverse();

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <p className="text-center text-2xl font-bold">
                {isSameUser ? "Your" : `${profileUserName}'s`} activities
            </p>
            {reversedActivityData.length > 0 &&
                reversedActivityData.map((activity) => {
                    let ratingUserName = "";
                    let ratingUserId = "";
                    if (activity.movieReviewId) {
                        const ratingUser = activity.movieReview.user;
                        ratingUserName = `${ratingUser.firstName} ${ratingUser.lastName}`;
                        ratingUserId = ratingUser.id;
                    }
                    const activityDate = new Date(activity.date);
                    const parsedDate = activityDate.toLocaleString("default", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    });

                    return (
                        <div
                            key={activity.id}
                            className="p-5 rounded-lg shadow-lg bg-sky-100"
                        >
                            <ActivityDetails
                                activity={activity}
                                userName={profileUserName}
                                ratingUserName={ratingUserName}
                                ratingUserId={ratingUserId}
                                parsedDate={parsedDate}
                                isSameUser={isSameUser}
                            />
                            {activity.movieReviewId && (
                                <ActivityOtherReview activity={activity} />
                            )}
                        </div>
                    );
                })}
            {reversedActivityData.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-10">
                    <p className="text-center text-lg">
                        {isSameUser ? "You have" : `${profileUserName} has`} no
                        activities
                    </p>
                    {isSameUser && (
                        <ButtonLink
                            text="Explore movies"
                            style="orange"
                            to="/movies"
                        />
                    )}
                </div>
            )}
        </div>
    );
};
