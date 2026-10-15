import type { FriendRecommendation } from "../../../../lib/entities";
import { BaseButton } from "../../../ui/BaseButton";
import { BaseLink } from "../../../ui/BaseLink";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { ActionFeedback } from "../../../ui/ActionFeedback";

interface FriendRecommendationCardProps {
    recommendation: FriendRecommendation;
    hasRequested: boolean;
    handleSendFriendRequest: (otherUserId: string) => Promise<void>;
}

export const FriendRecommendationCard = ({
    recommendation,
    hasRequested,
    handleSendFriendRequest,
}: FriendRecommendationCardProps) => {
    const { isPending, status, error, run } = useAsyncAction();
    const name = `${recommendation.user.firstName} ${recommendation.user.lastName}`;
    const sendRequest = () => {
        if (hasRequested) return;
        void run(() => handleSendFriendRequest(recommendation.user.id), {
            pending: `Sending friend request to ${name}…`,
            success: `Friend request sent to ${name}.`,
            error: "Could not send the friend request. Try again.",
        });
    };
    const sharedMovieCount = recommendation.sharedMovieCount;
    const sharedBookCount = recommendation.sharedBookCount;
    const sharedReviewCount = sharedMovieCount + sharedBookCount;
    const sharedReviewParts = [
        sharedMovieCount > 0
            ? `${sharedMovieCount} ${
                  sharedMovieCount === 1 ? "movie" : "movies"
              }`
            : null,
        sharedBookCount > 0
            ? `${sharedBookCount} ${sharedBookCount === 1 ? "book" : "books"}`
            : null,
    ].filter((part) => part !== null);
    const sharedFavoriteItems = recommendation.sharedFavoriteItems;

    return (
        <li className="flex w-76 shrink-0 flex-col justify-between gap-5 rounded-lg bg-white/70 p-4">
            <div className="flex min-w-0 gap-3">
                <img
                    src={recommendation.user.photo}
                    className="h-12 w-12 shrink-0 rounded-full object-cover object-top"
                    alt=""
                />
                <div className="min-w-0">
                    <BaseLink to={`/users/${recommendation.user.id}/profile`}>
                        {`${recommendation.user.firstName} ${recommendation.user.lastName}`}
                    </BaseLink>
                    <p className="text-sm text-sky-950">
                        {sharedReviewCount} shared{" "}
                        {sharedReviewCount === 1 ? "review" : "reviews"}
                        {sharedReviewParts.length > 0
                            ? ` (${sharedReviewParts.join(", ")})`
                            : ""}
                    </p>
                    {sharedFavoriteItems.length > 0 && (
                        <p className="text-sm text-sky-900">
                            You both liked{" "}
                            {sharedFavoriteItems.map((item, index) => (
                                <span key={`${item.mediaType}-${item.id}`}>
                                    {index > 0 ? ", " : ""}
                                    <BaseLink
                                        to={
                                            item.mediaType === "MOVIE"
                                                ? `/movies/${item.id}`
                                                : `/books/${item.id}`
                                        }
                                    >
                                        {item.title}
                                    </BaseLink>
                                </span>
                            ))}
                        </p>
                    )}
                </div>
            </div>
            <div className="w-full text-center">
                <BaseButton
                    style={hasRequested ? "disabled" : "sky"}
                    aria-disabled={hasRequested || isPending}
                    aria-busy={isPending}
                    aria-label={
                        hasRequested
                            ? `Request sent to ${name}`
                            : `Add friend: ${name}`
                    }
                    handleClick={sendRequest}
                >
                    {hasRequested ? "Request sent" : "Add friend"}
                </BaseButton>
            </div>
            <ActionFeedback status={status} error={error} />
        </li>
    );
};
