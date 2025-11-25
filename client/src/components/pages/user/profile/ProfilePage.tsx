import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import { User } from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { useAppDispatch } from "../../../../store/hooks";
import { sendFriendRequest } from "../../../../lib/actions";
import { triggerFriendEvent } from "../../../../store";
import { profileNavLinks } from "../../../../lib/data";
import { NavLink } from "../../../ui/NavLink";
import { BaseButton } from "../../../ui/BaseButton";

export const ProfilePage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { visitingUser, isSameUser, profileUserName } =
        useIsSameUser(profileUser);

    const dispatch = useAppDispatch();

    const areFriends =
        (visitingUser &&
            profileUser.friends.some(
                (friend) => friend.id === visitingUser.id
            )) ||
        false;

    const visibleNavLinks = profileNavLinks.filter(
        (link) =>
            isSameUser ||
            (link.text !== "Messages" &&
                link.text !== "Settings" &&
                link.text !== "Friends")
    );

    const initialRequestSentState =
        (visitingUser &&
            profileUser.receivedFriendRequests.some(
                (request) => request.sentUserId === visitingUser?.id
            )) ||
        false;
    const [requestSent, setRequestSent] = useState(initialRequestSentState);

    const handleFriendRequest = async () => {
        if (!visitingUser) return;

        setRequestSent(true);

        try {
            const date = new Date();
            await sendFriendRequest(visitingUser.id, profileUser.id);
            dispatch(
                triggerFriendEvent(`new friend event at ${date.toString()}`)
            );
        } catch (error) {
            setRequestSent(false);
            console.error("Failed to send friend request:", error);
        }
    };

    return (
        <div className="flex flex-col justify-between p-5 rounded-lg shadow-lg bg-sky-100 gap-10 min-h-[70vh] md:w-2/3">
            <p className="text-center text-2xl font-bold">{profileUserName}</p>
            <img
                src="https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png"
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                {visibleNavLinks.map((link) => (
                    <NavLink key={link.text} to={link.to} text={link.text} />
                ))}
            </ul>
            <div className="flex justify-center">
                {visitingUser && !isSameUser && !areFriends && (
                    <BaseButton
                        text={
                            requestSent
                                ? "FRIEND REQUEST SENT"
                                : "SEND FRIEND REQUEST"
                        }
                        style={requestSent ? "disabled" : "orange"}
                        handleClick={
                            requestSent ? undefined : handleFriendRequest
                        }
                    />
                )}
            </div>
        </div>
    );
};
