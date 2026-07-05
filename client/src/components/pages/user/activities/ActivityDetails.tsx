import { useRouteLoaderData } from "react-router";
import { User, UserActivity } from "../../../../lib/entities";
import { BaseLink } from "../../../ui/BaseLink";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";

interface ActivityDetailsProps {
    activity: UserActivity;
    ratingUserName: string;
    ratingUserId: string;
    parsedDate: string;
}

export const ActivityDetails = ({
    activity,
    ratingUserName,
    ratingUserId,
    parsedDate,
}: ActivityDetailsProps) => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    const media = activity.movie ?? activity.book;
    const mediaId = activity.movieId ?? activity.bookId;
    const mediaUrl = activity.movieId
        ? `/movies/${activity.movieId}`
        : `/books/${activity.bookId}`;
    const mediaFullTitle = media
        ? `${media.title} (${media.releaseYear})`
        : "";
    const isRatingActivity = mediaId && activity.action === "rated";
    const isWishlistActivity =
        mediaId &&
        (activity.action === "wishlisted" ||
            activity.action === "unwishlisted");
    const isReviewLikeActivity =
        (activity.movieReviewId || activity.bookReviewId) &&
        (activity.action === "liked" || activity.action === "unliked");

    return (
        <>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                <p className="flex items-start min-w-0">
                    <img
                        src={activity.user.photo}
                        className="object-cover object-top w-8 h-8 rounded-full shrink-0 mr-2"
                        alt="user photo"
                    />
                    <span className="font-bold break-words">
                        {isRatingActivity && (
                            <>
                                {isSameUser ? "You" : profileUserName} rated{" "}
                                {activity.reviewRating}/10{" "}
                                <BaseLink to={mediaUrl}>
                                    {mediaFullTitle}
                                </BaseLink>
                            </>
                        )}
                        {isWishlistActivity && (
                            <>
                                {isSameUser ? "You" : profileUserName}{" "}
                                {activity.action === "wishlisted"
                                    ? "added"
                                    : "removed"}{" "}
                                <BaseLink to={mediaUrl}>
                                    {mediaFullTitle}
                                </BaseLink>{" "}
                                {activity.action === "wishlisted"
                                    ? "to"
                                    : "from"}{" "}
                                wishlist
                            </>
                        )}
                        {isReviewLikeActivity && (
                            <>
                                {isSameUser ? "You" : profileUserName}{" "}
                                {activity.action === "liked"
                                    ? "liked"
                                    : "unliked"}{" "}
                                a review by{" "}
                                <BaseLink to={`/users/${ratingUserId}/profile`}>
                                    {ratingUserName}
                                </BaseLink>
                            </>
                        )}
                    </span>
                </p>
                <p className="text-sm sm:text-base sm:text-right shrink-0">
                    <span className="italic">{parsedDate}</span>
                </p>
            </div>
            {mediaId && activity.reviewText && (
                <p className="mt-2 break-words">
                    <strong>Review</strong>: {activity.reviewText}
                </p>
            )}
            {mediaId &&
                activity.action === "rated" &&
                !activity.reviewText && (
                    <p className="italic mt-2">No review</p>
                )}
        </>
    );
};
