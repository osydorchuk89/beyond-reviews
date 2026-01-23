import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import { Friend, User } from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { FriendRequestsSection } from "./FriendRequestsSection";
import { FriendsList } from "./FriendsList";
import { acceptFriendRequest } from "../../../../lib/api";

export const UserFriendsPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };

    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    // Track accepted requests locally
    const [acceptedRequestIds, setAcceptedRequestIds] = useState<string[]>([]);
    const [userFriends, setUserFriends] = useState<Friend[]>(
        profileUser.friends,
    );

    // Filter out accepted requests from received requests
    const filteredReceivedRequests = profileUser.receivedFriendRequests.filter(
        (request) => !acceptedRequestIds.includes(request.sentUserId),
    );

    const handleFriendRequest = async (userId: string, otherUserId: string) => {
        const acceptedRequest = profileUser.receivedFriendRequests.find(
            (request) => request.sentUserId === otherUserId,
        );

        if (!acceptedRequest) return;

        setAcceptedRequestIds((prev) => [...prev, otherUserId]);

        const newFriend: Friend = {
            id: acceptedRequest.sentUserId,
            firstName: acceptedRequest.sentUser.firstName,
            lastName: acceptedRequest.sentUser.lastName,
            photo: acceptedRequest.sentUser.photo,
        };
        setUserFriends((prev) => [...prev, newFriend]);

        try {
            await acceptFriendRequest(userId, otherUserId);
        } catch (error) {
            setAcceptedRequestIds((prev) =>
                prev.filter((id) => id !== otherUserId),
            );
            setUserFriends((prev) =>
                prev.filter((friend) => friend.id !== otherUserId),
            );
            console.error("Failed to accept friend request:", error);
        }
    };

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full md:w-2/3">
            <h2 className="text-xl text-center font-bold">Friends</h2>
            {filteredReceivedRequests.length > 0 && isSameUser && (
                <FriendRequestsSection
                    title="Received friend requests"
                    requests={filteredReceivedRequests}
                    type="received"
                    onAcceptRequest={handleFriendRequest}
                    profileUserId={profileUser.id}
                />
            )}
            {profileUser.sentFriendRequests.length > 0 && isSameUser && (
                <FriendRequestsSection
                    title="Sent friend requests"
                    requests={profileUser.sentFriendRequests}
                    type="sent"
                />
            )}
            <FriendsList
                friends={userFriends}
                isSameUser={isSameUser}
                profileUserName={profileUserName}
            />
        </div>
    );
};
