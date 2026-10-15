import { useId, useRef, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import type {
    User,
    UserActivities,
    UserActivityTab,
} from "../../../../lib/entities";
import { getUserActivities } from "../../../../lib/api";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { ButtonLink } from "../../../ui/ButtonLink";
import { ActivityItem } from "./ActivityItem";
import { Pagination } from "../../../ui/Pagination";
import { MediaTabs } from "../../../ui/MediaTabs";

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
    const tabsId = useId();
    const requestId = useRef(0);
    const [status, setStatus] = useState("");
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);
    const { activities, currentPage, totalPages } = activitiesData;
    const selectedTabLabel =
        tabs.find((tab) => tab.value === activeTab)?.label.toLowerCase() ??
        "activities";
    const exploreTo = activeTab === "books" ? "/books" : "/movies";
    const exploreLabel =
        activeTab === "books" ? "Explore books" : "Explore movies";

    const fetchActivities = async (tab: UserActivityTab, page: number) => {
        const currentRequest = ++requestId.current;
        setIsLoading(true);
        setHasError(false);
        setStatus(`Loading ${tab} activities…`);

        try {
            const nextActivitiesData = await getUserActivities(
                profileUser.id,
                page,
                tab,
            );
            if (currentRequest !== requestId.current) return;
            setActivitiesData(nextActivitiesData);
            setStatus(
                `${tab} activities loaded. Page ${page}. ${nextActivitiesData.activities.length} activities shown.`,
            );
        } catch (error) {
            if (currentRequest !== requestId.current) return;
            console.log(error);
            setHasError(true);
            setStatus("");
        } finally {
            if (currentRequest === requestId.current) setIsLoading(false);
        }
    };

    const handleTabChange = async (tab: UserActivityTab) => {
        if (tab === activeTab && !hasError) return;
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
                <MediaTabs
                    id={tabsId}
                    label="Activities media"
                    tabs={tabs}
                    selected={activeTab}
                    onSelect={handleTabChange}
                />
            </div>
            <p role="status" className="sr-only">
                {status}
            </p>
            <div
                id={`${tabsId}-panel`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-tab-${activeTab}`}
                aria-busy={isLoading}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Tab panels need a keyboard entry point, including empty and loading states (APG Tabs).
                tabIndex={0}
                className="flex flex-col gap-6 sm:gap-10"
            >
                {isLoading && (
                    <div className="flex min-h-48 items-center justify-center">
                        <div className="h-10 w-10 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
                    </div>
                )}
                {!isLoading && hasError && (
                    <p role="alert" className="text-center text-lg">
                        Could not load {selectedTabLabel} activities.
                    </p>
                )}
                {!isLoading &&
                    !hasError &&
                    activities.length > 0 &&
                    activities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                    ))}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                    />
                )}
                {!isLoading && !hasError && activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-10">
                        <p className="text-center text-lg">
                            {isSameUser ? "You have" : `${profileUserName} has`}{" "}
                            no
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
        </div>
    );
};
