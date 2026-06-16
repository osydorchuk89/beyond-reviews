import { Suspense, useState } from "react";
import { Await, useLoaderData, useRouteLoaderData } from "react-router";

import {
    Friend,
    FriendRecommendationsData,
    User,
} from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { FriendRequestsSection } from "./FriendRequestsSection";
import { FriendsList } from "./FriendsList";
import { acceptFriendRequest, sendFriendRequest } from "../../../../lib/api";
import { FriendRecommendationsSection } from "./FriendRecommendationsSection";
import { FriendRecommendationsLoadingSection } from "./FriendRecommendationsLoadingSection";

interface FriendRecommendationsLoaderResult {
    friendRecommendationsData: FriendRecommendationsData | null;
    friendRecommendationsError: boolean;
}

export const UserFriendsPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { friendRecommendationsResultPromise } =
        useLoaderData() as {
            friendRecommendationsResultPromise: Promise<FriendRecommendationsLoaderResult>;
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

    const handleSendFriendRequest = async (otherUserId: string) => {
        await sendFriendRequest(profileUser.id, otherUserId);
    };

    return (
        <div className="flex flex-col gap-6 sm:gap-10 min-h-[70vh] w-full">
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
            {isSameUser && (
                <Suspense fallback={<FriendRecommendationsLoadingSection />}>
                    <Await resolve={friendRecommendationsResultPromise}>
                        {({
                            friendRecommendationsData,
                            friendRecommendationsError,
                        }) => {
                            if (friendRecommendationsError) {
                                return (
                                    <p className="text-center">
                                        Friend recommendations could not be
                                        loaded.
                                    </p>
                                );
                            }

                            if (!friendRecommendationsData) return null;

                            const recommendedFriends =
                                friendRecommendationsData.recommendations.filter(
                                    (recommendation) =>
                                        !userFriends.some(
                                            (friend) =>
                                                friend.id ===
                                                recommendation.user.id,
                                        ),
                                );

                            return (
                                <FriendRecommendationsSection
                                    {...friendRecommendationsData}
                                    recommendations={recommendedFriends}
                                    onSendFriendRequest={
                                        handleSendFriendRequest
                                    }
                                />
                            );
                        }}
                    </Await>
                </Suspense>
            )}
        </div>
    );
};
