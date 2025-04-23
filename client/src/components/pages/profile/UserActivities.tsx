import { useNavigate, useRouteLoaderData } from "react-router";

import { UserActivity } from "../../../lib/entities";
import { Button } from "../../ui/Button";
import { ActivityDetails } from "./ActivityDetails";
import { ActivityOtherReview } from "./ActivityOtherReview";

export const UserActivities = () => {
    const { userActivities } = useRouteLoaderData("profile");
    // const userName = `${user.firstName} ${user.lastName}`;

    // const isSameUser = userId === authStatus!.userData?._id;

    const reversedActivityData: UserActivity[] = [...userActivities].reverse();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col my-20 mx-60 gap-10">
            <p className="text-center text-2xl font-bold">Your Activity</p>
            {reversedActivityData.length > 0 &&
                reversedActivityData.map((activity) => {
                    let ratingUserName = "";
                    let ratingUserId;
                    if (activity.movieReviewId) {
                        const ratingUser = activity.movieReview.user;
                        ratingUserName = `${ratingUser.firstName} ${ratingUser.lastName}`;
                        // ratingUserId = "";
                    }
                    const activityDate = new Date(activity.date);
                    const parsedDate = activityDate.toLocaleString("en-GB", {
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
                                ratingUserName={ratingUserName}
                                parsedDate={parsedDate}
                            />
                            {activity.movieReviewId && (
                                <ActivityOtherReview activity={activity} />
                            )}
                        </div>
                    );
                })}
            {userActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-10">
                    <p className="text-center text-lg">
                        You have no activities
                    </p>
                    <Button
                        text="Explore movies"
                        style="dark"
                        handleClick={() => navigate("/movies")}
                    />
                </div>
            )}
        </div>
    );
};
