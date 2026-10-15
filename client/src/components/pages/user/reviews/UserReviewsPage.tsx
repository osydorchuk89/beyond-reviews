import { useId, useRef, useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import { getUserBookReviews, getUserMovieReviews } from "../../../../lib/api";
import type {
    BookReview,
    MovieReview,
    User,
    UserBookReviews,
    UserMovieReviews,
    UserReviewTab,
} from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { MediaTabs } from "../../../ui/MediaTabs";
import { ButtonLink } from "../../../ui/ButtonLink";
import { Pagination } from "../../../ui/Pagination";
import { BookReviewDetails } from "./BookReviewDetails";
import { MovieReviewDetails } from "./MovieReviewDetails";

type UserReviewsData = UserMovieReviews | UserBookReviews;

const tabs: { value: UserReviewTab; label: string }[] = [
    { value: "books", label: "Books" },
    { value: "movies", label: "Movies" },
    { value: "albums", label: "Albums" },
];

const emptyUserReviews: UserReviewsData = {
    reviews: [],
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasMore: false,
};

export const UserReviewsPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userReviews, selectedTab } = useLoaderData() as {
        userReviews: UserReviewsData;
        selectedTab: UserReviewTab;
    };
    const [activeTab, setActiveTab] = useState<UserReviewTab>(selectedTab);
    const [reviewsData, setReviewsData] =
        useState<UserReviewsData>(userReviews);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const tabsId = useId();
    const requestId = useRef(0);
    const [status, setStatus] = useState("");
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);
    const { reviews, currentPage, totalPages } = reviewsData;
    const selectedTabLabel =
        tabs.find((tab) => tab.value === activeTab)?.label.toLowerCase() ??
        "reviews";
    const exploreTo = activeTab === "books" ? "/books" : "/movies";
    const exploreLabel =
        activeTab === "books" ? "Explore books" : "Explore movies";

    const fetchReviews = async (tab: UserReviewTab, page: number) => {
        const currentRequest = ++requestId.current;
        setIsLoading(true);
        setHasError(false);
        setStatus(`Loading ${tab} reviews…`);

        try {
            const nextReviewsData =
                tab === "albums"
                    ? { ...emptyUserReviews, currentPage: page }
                    : tab === "movies"
                      ? await getUserMovieReviews(profileUser.id, page)
                      : await getUserBookReviews(profileUser.id, page);
            if (currentRequest !== requestId.current) return;
            setReviewsData(nextReviewsData);
            setStatus(
                `${tab} reviews loaded. Page ${page}. ${nextReviewsData.reviews.length} reviews shown.`,
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

    const handleTabChange = async (tab: UserReviewTab) => {
        if (tab === activeTab && !hasError) return;
        setActiveTab(tab);
        await fetchReviews(tab, 1);
    };

    const handlePageChange = async (page: number) => {
        await fetchReviews(activeTab, page);
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-10 min-h-[70vh] w-full max-w-4xl">
            <div className="flex flex-col items-center gap-5">
                <h2 className="text-center text-xl font-bold">Reviews</h2>
                <MediaTabs
                    id={tabsId}
                    label="Reviews media"
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
                        Could not load {selectedTabLabel} reviews.
                    </p>
                )}
                {!isLoading && !hasError && reviews.length ? (
                    <ul className="flex flex-col gap-4">
                        {activeTab === "movies"
                            ? (reviews as MovieReview[]).map((review) => (
                                  <MovieReviewDetails
                                      key={review.id}
                                      review={review}
                                  />
                              ))
                            : (reviews as BookReview[]).map((review) => (
                                  <BookReviewDetails
                                      key={review.id}
                                      review={review}
                                  />
                              ))}
                    </ul>
                ) : null}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                    />
                )}
                {!isLoading && !hasError && reviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-10">
                        <p className="text-center text-lg">
                            {isSameUser ? "You have" : `${profileUserName} has`}{" "}
                            no
                            {activeTab === "albums"
                                ? " album reviews yet"
                                : ` ${selectedTabLabel} reviews yet`}
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
