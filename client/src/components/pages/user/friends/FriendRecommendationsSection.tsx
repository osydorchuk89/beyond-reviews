import { useState } from "react";

import { FriendRecommendation } from "../../../../lib/entities";
import { useHorizontalScroll } from "../../../../hooks/useHorizontalScroll";
import { ArrowIcon } from "../../../icons/ArrowIcon";
import { FriendRecommendationCard } from "./FriendRecommendationCard";

interface FriendRecommendationsSectionProps {
    currentReviewCount: number;
    minReviewsRequired: number;
    recommendationsAvailable: boolean;
    recommendations: FriendRecommendation[];
    onSendFriendRequest: (otherUserId: string) => Promise<void>;
}

export const FriendRecommendationsSection = ({
    currentReviewCount,
    minReviewsRequired,
    recommendationsAvailable,
    recommendations,
    onSendFriendRequest,
}: FriendRecommendationsSectionProps) => {
    const [requestedUserIds, setRequestedUserIds] = useState<string[]>([]);
    const reviewsRemaining = Math.max(
        minReviewsRequired - currentReviewCount,
        0,
    );

    const handleSendFriendRequest = async (otherUserId: string) => {
        setRequestedUserIds((prev) => [...prev, otherUserId]);
        try {
            await onSendFriendRequest(otherUserId);
        } catch (error) {
            setRequestedUserIds((prev) =>
                prev.filter((userId) => userId !== otherUserId),
            );
            console.error("Failed to send friend request:", error);
        }
    };

    const { scrollContainerRef, canScrollLeft, canScrollRight, handleScroll } =
        useHorizontalScroll(recommendations.length);

    return (
        <section className="flex flex-col gap-8 w-full rounded-xl bg-fuchsia-100 p-4 sm:p-6">
            <h3 className="text-xl text-center text-fuchsia-950 font-bold">
                Suggested friends
            </h3>
            {!recommendationsAvailable ? (
                <div className="rounded-lg border border-dashed border-sky-700 bg-white/70 p-4 text-center text-sky-950">
                    <p className="font-semibold">
                        Review {reviewsRemaining} more{" "}
                        {reviewsRemaining === 1 ? "movie" : "movies"} to unlock
                        friend recommendations.
                    </p>
                    <p className="mt-1 text-sm">
                        Friend suggestions appear once you have reviewed at
                        least {minReviewsRequired} movies.
                    </p>
                </div>
            ) : recommendations.length > 0 ? (
                <div className="flex items-center gap-4">
                    <ArrowIcon
                        direction="left"
                        onClick={() => handleScroll("left")}
                        disabled={!canScrollLeft}
                    />
                    <div
                        ref={scrollContainerRef}
                        className="w-full overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <ul className="flex w-max gap-8 pr-4">
                            {recommendations.map((recommendation) => {
                                const hasRequested = requestedUserIds.includes(
                                    recommendation.user.id,
                                );
                                return (
                                    <FriendRecommendationCard
                                        key={recommendation.user.id}
                                        recommendation={recommendation}
                                        hasRequested={hasRequested}
                                        handleSendFriendRequest={
                                            handleSendFriendRequest
                                        }
                                    />
                                );
                            })}
                        </ul>
                    </div>
                    <ArrowIcon
                        direction="right"
                        onClick={() => handleScroll("right")}
                        disabled={!canScrollRight}
                    />
                </div>
            ) : (
                <p className="text-center">
                    No friend recommendations are available yet.
                </p>
            )}
        </section>
    );
};
