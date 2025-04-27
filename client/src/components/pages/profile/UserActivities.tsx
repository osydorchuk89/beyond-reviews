import {
    useLoaderData,
    useNavigate,
    useParams,
    useRouteLoaderData,
} from "react-router";

import { User, UserActivity } from "../../../lib/entities";
import { Button } from "../../ui/Button";
import { ActivityDetails } from "./ActivityDetails";
import { ActivityOtherReview } from "./ActivityOtherReview";
import { useAuthData } from "../../../hooks/useAuthData";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

export const UserActivities = () => {
    const { user } = useRouteLoaderData("userProfile") as { user: User };
    const { userActivities } = useLoaderData();
    const userName = `${user.firstName} ${user.lastName}`;

    const reversedActivityData: UserActivity[] = [...userActivities].reverse();
    const navigate = useNavigate();

    const { authData, authDataFetching } = useAuthData();

    const { userId } = useParams();
    const isSameUser = (authData.user && userId === authData.user.id) || false;

    if (authDataFetching) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col my-20 mx-60 gap-10">
            <p className="text-center text-2xl font-bold">
                {isSameUser ? "Your" : `${userName}'s`} activities
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
                                userName={userName}
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
            {userActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-10">
                    <p className="text-center text-lg">
                        {isSameUser ? "You" : userName} have no activities
                    </p>
                    {isSameUser && (
                        <Button
                            text="Explore movies"
                            style="orange"
                            handleClick={() => navigate("/movies")}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
