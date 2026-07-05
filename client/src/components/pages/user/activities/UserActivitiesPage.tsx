import { useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import {
    User,
    UserActivities,
    UserActivityTab,
} from "../../../../lib/entities";
import { getUserActivities } from "../../../../lib/api";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { ButtonLink } from "../../../ui/ButtonLink";
import { ActivityItem } from "./ActivityItem";
import { Pagination } from "../../../ui/Pagination";
import { BaseTab } from "../../../ui/BaseTab";

const tabs: { value: UserActivityTab; label: string }[] = [
    { value: "books", label: "Books" },
    { value: "movies", label: "Movies" },
    { value: "albums", label: "Albums" },
];

export const UserActivitiesPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userActivities, selectedTab } = useLoaderData() as {
        userActivities: UserActivities;
        selectedTab: UserActivityTab;
    };
    const [activeTab, setActiveTab] = useState<UserActivityTab>(selectedTab);
    const [activitiesData, setActivitiesData] =
        useState<UserActivities>(userActivities);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);
    const { activities, currentPage, totalPages } = activitiesData;
    const selectedTabLabel =
        tabs.find((tab) => tab.value === activeTab)?.label.toLowerCase() ??
        "activities";
    const exploreTo = activeTab === "books" ? "/books" : "/movies";
    const exploreLabel =
        activeTab === "books" ? "Explore books" : "Explore movies";

    const fetchActivities = async (tab: UserActivityTab, page: number) => {
        setIsLoading(true);
        setHasError(false);

        try {
            const nextActivitiesData = await getUserActivities(
                profileUser.id,
                page,
                tab,
            );
            setActivitiesData(nextActivitiesData);
        } catch (error) {
            console.log(error);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = async (tab: UserActivityTab) => {
        setActiveTab(tab);
        await fetchActivities(tab, 1);
    };

    const handlePageChange = async (page: number) => {
        await fetchActivities(activeTab, page);
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-10 min-h-[70vh] w-full max-w-4xl">
            <div className="flex flex-col items-center gap-5">
                <h2 className="text-center text-xl font-bold">Activities</h2>
                <div className="flex flex-wrap justify-center gap-2">
                    {tabs.map((tab) => (
                        <BaseTab
                            key={tab.value}
                            isSelected={activeTab === tab.value}
                            onClick={() => handleTabChange(tab.value)}
                        >
                            {tab.label}
                        </BaseTab>
                    ))}
                </div>
            </div>
            {isLoading && (
                <div className="flex min-h-48 items-center justify-center">
                    <div className="h-10 w-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                </div>
            )}
            {!isLoading && hasError && (
                <p className="text-center text-lg">
                    Could not load {selectedTabLabel} activities.
                </p>
            )}
            {!isLoading && !hasError && activities.length > 0 && (
                <>
                    {activities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                    ))}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
            {!isLoading && !hasError && activities.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-10">
                    <p className="text-center text-lg">
                        {isSameUser ? "You have" : `${profileUserName} has`} no
                        {activeTab === "albums"
                            ? " album activities yet"
                            : ` ${selectedTabLabel} activities`}
                    </p>
                    {isSameUser && activeTab !== "albums" && (
                        <ButtonLink style="orange" to={exploreTo}>
                            {exploreLabel}
                        </ButtonLink>
                    )}
                </div>
            )}
        </div>
    );
};
