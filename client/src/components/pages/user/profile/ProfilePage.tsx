import { useParams, useRouteLoaderData } from "react-router";

import { User } from "../../../../lib/entities";
import { useAuthData } from "../../../../hooks/useAuthData";
import { useUserData } from "../../../../hooks/useUserData";
import { useUserIdentity } from "../../../../hooks/useUserIdentity";
import { useAppDispatch } from "../../../../store/hooks";
import { sendFriendRequest } from "../../../../lib/actions";
import { triggerFriendEvent } from "../../../../store";
import { LoadingSpinner } from "../../../ui/LoadingSpinner";
import { profileNavLinks } from "../../../../lib/data";
import { NavLink } from "../../../ui/NavLink";
import { BaseButton } from "../../../ui/BaseButton";

export const ProfilePage = () => {
    const { userId } = useParams() as { userId: string };
    const { user: initialUserData } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { authData, authDataFetching } = useAuthData();

    const { user, isLoading: userDataLoading } = useUserData(
        userId,
        initialUserData
    );
    const { isSameUser } = useUserIdentity(user);

    const friendRequestSent = user.receivedFriendRequests.some(
        (request) => request.sentUserId === authData.user?.id
    );

    const areFriends =
        authData.user &&
        user.friends.some((friend) => friend.id === authData.user.id);

    const dispatch = useAppDispatch();
    const handleFriendRequest = async () => {
        const date = new Date();
        await sendFriendRequest(authData.user.id, user.id);
        dispatch(triggerFriendEvent(`new friend event at ${date.toString()}`));
    };

    if (authDataFetching || userDataLoading) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <LoadingSpinner />
            </div>
        );
    }
    return (
        <div className="flex flex-col justify-between p-5 rounded-lg shadow-lg bg-sky-100 gap-10 min-h-[70vh] md:w-2/3">
            <p className="text-center text-2xl font-bold">
                {user.firstName} {user.lastName}
            </p>
            <img
                src="https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png"
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                {profileNavLinks
                    .filter(
                        (link) =>
                            isSameUser ||
                            (link.text !== "Messages" &&
                                link.text !== "Settings")
                    )
                    .map((link) => (
                        <NavLink
                            key={link.text}
                            to={link.to}
                            text={link.text}
                        />
                    ))}
            </ul>
            <div className="flex justify-center">
                {authData.user && !isSameUser && !areFriends && (
                    <BaseButton
                        text={
                            friendRequestSent
                                ? "FRIEND REQUEST SENT"
                                : "SEND FRIEND REQUEST"
                        }
                        style={friendRequestSent ? "disabled" : "orange"}
                        handleClick={
                            friendRequestSent ? undefined : handleFriendRequest
                        }
                    />
                )}
            </div>
        </div>
    );
};
