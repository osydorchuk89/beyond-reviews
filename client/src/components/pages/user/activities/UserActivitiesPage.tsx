import { useLoaderData, useRouteLoaderData } from "react-router";

import { User, UserActivities } from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { ButtonLink } from "../../../ui/ButtonLink";
import { ActivityItem } from "./ActivityItem";
import { Pagination } from "../../../ui/Pagination";

export const UserActivitiesPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userActivities } = useLoaderData() as {
        userActivities: UserActivities;
    };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);
    const { activities, currentPage, totalPages } = userActivities;

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <h2 className="text-center text-xl font-bold">Activities</h2>
            <>
                {activities.length > 0 && (
                    <>
                        {activities.map((activity) => (
                            <ActivityItem
                                key={activity.id}
                                activity={activity}
                            />
                        ))}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                            />
                        )}
                    </>
                )}
                {activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-10">
                        <p className="text-center text-lg">
                            {isSameUser ? "You have" : `${profileUserName} has`}{" "}
                            no activities
                        </p>
                        {isSameUser && (
                            <ButtonLink style="orange" to="/movies">
                                Explore movies
                            </ButtonLink>
                        )}
                    </div>
                )}
            </>
        </div>
    );
};
