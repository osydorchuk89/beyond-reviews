import { useState } from "react";

import { FriendRecommendation } from "../../../../lib/entities";
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

    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-lg font-bold text-sky-950">
                Suggested friends
            </h3>
            {!recommendationsAvailable ? (
                <div className="rounded-lg border border-dashed border-sky-700 bg-sky-50 p-4 text-center text-sky-950">
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
                <ul className="flex flex-col gap-4 sm:gap-5">
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
            ) : (
                <p className="text-center">
                    No friend recommendations are available yet.
                </p>
            )}
        </section>
    );
};
