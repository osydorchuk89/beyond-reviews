import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import { Friend, Message, User, UsersMessages } from "../../../../lib/entities";
import { ChatSidePanel } from "./ChatSidePanel";
import { ChatHistory } from "./ChatHistory";
import { getChatHistory, sendMessage } from "../../../../lib/actions";
import { useAppDispatch } from "../../../../store/hooks";
import { triggerMessageEvent } from "../../../../store";

export const UserMessages = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const dispatch = useAppDispatch();

    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [chatHistory, setChatHistory] = useState<UsersMessages | null>(null);
    const [loading, setLoading] = useState(false);

    // Handler for selecting a friend
    const handleSelectFriend = async (friend: Friend) => {
        setLoading(true);
        const userId = profileUser.id;
        const history = await getChatHistory(userId, friend.id);
        setChatHistory(history);
        setSelectedFriend(friend);
        setLoading(false);
    };

    // Handler for sending a message
    const handleSendMessage = async (text: string) => {
        if (!selectedFriend || !chatHistory) return;
        const userId = profileUser.id;
        const friendId = selectedFriend.id;

        // Send the message to the server
        const date = new Date();
        const newMessage: Message = await sendMessage(userId, friendId, text);
        dispatch(
            triggerMessageEvent(`new message event at ${date.toString()}`)
        );

        // Optimistically update chatHistory with the new message
        setChatHistory((prev) =>
            prev
                ? {
                      ...prev,
                      messages: [...prev.messages, newMessage],
                  }
                : prev
        );
    };

    const selectedFriendName = selectedFriend
        ? `${selectedFriend.firstName} ${selectedFriend.lastName}`
        : "No user selected";

    return (
        <div className="flex flex-col gap-10 min-h-[70vh] w-full">
            <h2 className="text-2xl text-center font-bold">Messages</h2>
            <div className="flex rounded-md overflow-hidden h-[600px]">
                <ChatSidePanel
                    user={profileUser}
                    selectedFriend={selectedFriend}
                    setSelectedFriend={handleSelectFriend}
                />
                <ChatHistory
                    friendName={selectedFriendName}
                    chatHistory={chatHistory}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                />
            </div>
        </div>
    );
};
