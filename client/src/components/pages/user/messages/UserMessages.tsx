import { useState } from "react";
import { useParams, useRouteLoaderData } from "react-router";

import { Friend, User } from "../../../../lib/entities";
import { useUserData } from "../../../../hooks/useUserData";
import { ChatSidePanel } from "./ChatSidePanel";
import { ChatHistory } from "./ChatHistory";

export const UserMessages = () => {
    const { userId } = useParams() as { userId: string };
    const { user: initialUserData } = useRouteLoaderData("userProfile") as {
        user: User;
    };

    const { user } = useUserData(userId, initialUserData);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

    let selectedFriendId = "";
    let selectedFriendName = "No user selected";
    if (selectedFriend) {
        selectedFriendId = selectedFriend.id;
        selectedFriendName = `${selectedFriend.firstName} ${selectedFriend.lastName}`;
    }

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full">
            <h2 className="text-2xl text-center font-bold">Messages</h2>
            <div className="flex rounded-md overflow-hidden h-[600px]">
                <ChatSidePanel
                    user={user}
                    selectedFriend={selectedFriend}
                    setSelectedFriend={setSelectedFriend}
                />
                <ChatHistory
                    friendId={selectedFriendId}
                    friendName={selectedFriendName}
                />
            </div>
        </div>
    );
};
