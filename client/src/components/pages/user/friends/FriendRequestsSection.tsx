import {
    ReceivedFriendRequest,
    SentFriendRequest,
} from "../../../../lib/entities";
import { FriendRequestItem } from "./FriendRequestItem";

interface FriendRequestsSectionProps {
    title: string;
    requests: ReceivedFriendRequest[] | SentFriendRequest[];
    type: "received" | "sent";
    onAcceptRequest?: (profileUserId: string, requestUserId: string) => void;
    profileUserId?: string;
}

export const FriendRequestsSection = ({
    title,
    requests,
    type,
    onAcceptRequest,
    profileUserId,
}: FriendRequestsSectionProps) => {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-xl font-medium text-center">{title}</p>
            <div className="flex flex-col p-5 rounded-lg shadow-lg bg-sky-100 gap-8">
                <ul className="flex flex-col gap-4">
                    {requests.map((request) => {
                        const user =
                            type === "received"
                                ? (request as ReceivedFriendRequest).sentUser
                                : (request as SentFriendRequest).receivedUser;
                        const userId =
                            type === "received"
                                ? (request as ReceivedFriendRequest).sentUserId
                                : (request as SentFriendRequest).receivedUserId;

                        return (
                            <FriendRequestItem
                                key={userId}
                                userId={userId}
                                firstName={user.firstName}
                                lastName={user.lastName}
                                photo={user.photo}
                                showAcceptButton={type === "received"}
                                onAccept={
                                    type === "received" &&
                                    onAcceptRequest &&
                                    profileUserId
                                        ? () =>
                                              onAcceptRequest(
                                                  profileUserId,
                                                  userId
                                              )
                                        : undefined
                                }
                            />
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};
