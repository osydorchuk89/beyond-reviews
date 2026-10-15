import { Suspense, useLayoutEffect, useRef, useState } from "react";
import { Await, useLoaderData, useRouteLoaderData } from "react-router";

import type {
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
import { ActionFeedback } from "../../../ui/ActionFeedback";

interface FriendRecommendationsLoaderResult {
    friendRecommendationsData: FriendRecommendationsData | null;
    friendRecommendationsError: boolean;
}

export const UserFriendsPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { friendRecommendationsResultPromise } = useLoaderData() as {
        friendRecommendationsResultPromise: Promise<FriendRecommendationsLoaderResult>;
    };

    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    // Track accepted requests locally
    const [acceptedRequestIds, setAcceptedRequestIds] = useState<string[]>([]);
    const [userFriends, setUserFriends] = useState<Friend[]>(
        profileUser.friends,
    );
    const sectionRef = useRef<HTMLDivElement>(null);
    const pendingRequests = useRef(new Set<string>());
    const [pendingIds, setPendingIds] = useState<string[]>([]);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const focusAfterAccept = useRef<string | null>(null);

    // Move focus only if the removed Accept button still had focus at success.
    // biome-ignore lint/correctness/useExhaustiveDependencies(acceptedRequestIds): Wait for the accepted request to be removed from the DOM.
    useLayoutEffect(() => {
        const friendId = focusAfterAccept.current;
        if (!friendId) return;
        focusAfterAccept.current = null;
        const nextRequest =
            sectionRef.current?.querySelector<HTMLButtonElement>(
                "[data-accept-request]",
            );
        const friendLink = sectionRef.current?.querySelector<HTMLAnchorElement>(
            `[data-friend-id="${CSS.escape(friendId)}"]`,
        );
        (nextRequest ?? friendLink)?.focus();
    }, [acceptedRequestIds]);

    // Filter out accepted requests from received requests
    const filteredReceivedRequests = profileUser.receivedFriendRequests.filter(
        (request) => !acceptedRequestIds.includes(request.sentUserId),
    );

    const handleFriendRequest = async (
        userId: string,
        otherUserId: string,
        trigger: HTMLButtonElement,
    ) => {
        const acceptedRequest = profileUser.receivedFriendRequests.find(
            (request) => request.sentUserId === otherUserId,
        );

        if (
            !acceptedRequest ||
            pendingRequests.current.has(otherUserId) ||
            acceptedRequestIds.includes(otherUserId)
        )
            return;
        pendingRequests.current.add(otherUserId);
        setPendingIds([...pendingRequests.current]);
        setError("");
        const name = `${acceptedRequest.sentUser.firstName} ${acceptedRequest.sentUser.lastName}`;
        setStatus(`Accepting friend request from ${name}…`);

        const newFriend: Friend = {
            id: acceptedRequest.sentUserId,
            firstName: acceptedRequest.sentUser.firstName,
            lastName: acceptedRequest.sentUser.lastName,
            photo: acceptedRequest.sentUser.photo,
        };
        try {
            await acceptFriendRequest(userId, otherUserId);
            if (document.activeElement === trigger)
                focusAfterAccept.current = otherUserId;
            setAcceptedRequestIds((prev) => [...prev, otherUserId]);
            setUserFriends((prev) => [...prev, newFriend]);
            setStatus(`Friend request from ${name} accepted.`);
        } catch {
            setStatus("");
            setError("Could not accept the friend request. Try again.");
        } finally {
            pendingRequests.current.delete(otherUserId);
            setPendingIds([...pendingRequests.current]);
        }
    };

    const handleSendFriendRequest = async (otherUserId: string) => {
        await sendFriendRequest(profileUser.id, otherUserId);
    };

    return (
        <div
            ref={sectionRef}
            className="flex flex-col gap-6 sm:gap-10 min-h-[70vh] w-full"
        >
            <h2 className="text-xl text-center font-bold">Friends</h2>
            {filteredReceivedRequests.length > 0 && isSameUser && (
                <FriendRequestsSection
                    title="Received friend requests"
                    requests={filteredReceivedRequests}
                    type="received"
                    onAcceptRequest={handleFriendRequest}
                    profileUserId={profileUser.id}
                    pendingIds={pendingIds}
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
                                    <p role="alert" className="text-center">
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
            <ActionFeedback status={status} error={error} />
        </div>
    );
};
