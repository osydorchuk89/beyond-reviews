import { FriendRecommendation } from "../../../../lib/entities";
import { BaseButton } from "../../../ui/BaseButton";
import { BaseLink } from "../../../ui/BaseLink";

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
    return (
        <li className="flex flex-col gap-4 rounded-lg bg-sky-100 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
                <img
                    src={recommendation.user.photo}
                    className="h-10 w-10 shrink-0 rounded-full object-cover object-top"
                    alt="user photo"
                />
                <div className="min-w-0">
                    <BaseLink to={`/users/${recommendation.user.id}/profile`}>
                        {`${recommendation.user.firstName} ${recommendation.user.lastName}`}
                    </BaseLink>
                    <p className="text-sm text-sky-950">
                        {recommendation.sharedMovieCount} shared{" "}
                        {recommendation.sharedMovieCount === 1
                            ? "movie"
                            : "movies"}{" "}
                        reviewed
                    </p>
                    {recommendation.sharedFavoriteTitles.length > 0 && (
                        <p className="text-sm text-sky-900">
                            You both liked{" "}
                            {recommendation.sharedFavoriteTitles.join(", ")}
                        </p>
                    )}
                </div>
            </div>
            <div className="w-full text-center sm:w-auto">
                <BaseButton
                    style={hasRequested ? "disabled" : "sky"}
                    disabled={hasRequested}
                    handleClick={() =>
                        handleSendFriendRequest(recommendation.user.id)
                    }
                >
                    {hasRequested ? "Request sent" : "Add friend"}
                </BaseButton>
            </div>
        </li>
    );
};
