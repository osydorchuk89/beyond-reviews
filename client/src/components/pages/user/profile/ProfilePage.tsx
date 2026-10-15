import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import type { User } from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { profileNavLinks } from "../../../../lib/data";
import { BaseLink } from "../../../ui/BaseLink";
import { BaseButton } from "../../../ui/BaseButton";
import { sendFriendRequest } from "../../../../lib/api";
import { useAsyncAction } from "../../../../hooks/useAsyncAction";
import { ActionFeedback } from "../../../ui/ActionFeedback";

export const ProfilePage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { visitingUser, isSameUser } = useIsSameUser(profileUser);

    const areFriends = Boolean(
        visitingUser &&
            profileUser.friends.some((friend) => friend.id === visitingUser.id),
    );

    const visibleNavLinks = profileNavLinks.filter(
        (link) =>
            isSameUser ||
            (link.text !== "Messages" &&
                link.text !== "Settings" &&
                link.text !== "Friends"),
    );

    const initialRequestSentState =
        (visitingUser &&
            profileUser.receivedFriendRequests.some(
                (request) => request.sentUserId === visitingUser?.id,
            )) ||
        false;
    const [requestSent, setRequestSent] = useState(initialRequestSentState);
    const { isPending, status, error, run } = useAsyncAction();

    const handleFriendRequest = async () => {
        if (!visitingUser || requestSent) return;
        await run(
            async () => {
                await sendFriendRequest(visitingUser.id, profileUser.id);
                setRequestSent(true);
            },
            {
                pending: "Sending friend request…",
                success: `Friend request sent to ${profileUser.firstName} ${profileUser.lastName}.`,
                error: "Could not send the friend request. Try again.",
            },
        );
    };

    return (
        <div className="flex flex-col justify-between p-4 sm:p-5 rounded-lg shadow-lg bg-sky-100 gap-8 min-h-[70vh] w-full max-w-2xl">
            <img
                src={profileUser.photo}
                className="object-cover object-top w-28 h-28 sm:w-32 sm:h-32 rounded-full self-center"
                alt={`${profileUser.firstName} ${profileUser.lastName}`}
            />
            <nav aria-label="Profile">
                <ul className="flex flex-col items-center gap-5 text-lg">
                    {visibleNavLinks.map((link) => (
                        <li key={link.text}>
                            <BaseLink to={link.to}>{link.text}</BaseLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="flex justify-center">
                {visitingUser && !isSameUser && !areFriends && (
                    <div className="w-full sm:w-auto flex justify-center text-center">
                        <BaseButton
                            style={requestSent ? "disabled" : "orange"}
                            aria-disabled={requestSent || isPending}
                            aria-busy={isPending}
                            handleClick={
                                requestSent ? undefined : handleFriendRequest
                            }
                        >
                            {requestSent
                                ? "FRIEND REQUEST SENT"
                                : "SEND FRIEND REQUEST"}
                        </BaseButton>
                    </div>
                )}
            </div>
            <ActionFeedback status={status} error={error} />
        </div>
    );
};
