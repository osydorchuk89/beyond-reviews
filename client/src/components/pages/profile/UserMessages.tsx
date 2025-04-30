import { useParams, useRouteLoaderData } from "react-router";
import { User, Friend } from "../../../lib/entities";
import { useAppSelector } from "../../../store/hooks";
import { useEffect, useState } from "react";
import { getUser } from "../../../lib/actions";
import { ChatHistory } from "./ChatHistory";
import { ChatSidePanel } from "./ChatSidePanel";

export const UserMessages = () => {
    const { userId } = useParams() as { userId: string };
    const { user: initialUserData } = useRouteLoaderData("userProfile") as {
        user: User;
    };

    const [user, setUser] = useState(initialUserData);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

    const friendEvent = useAppSelector((state) => state.friendEvent);
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUser(userId);
            setUser(user);
        };
        fetchUser();
    }, [friendEvent]);

    let selectedFriendId = "";
    let selectedFriendName = "No user selected";
    if (selectedFriend) {
        selectedFriendId = selectedFriend.id;
        selectedFriendName = `${selectedFriend.firstName} ${selectedFriend.lastName}`;
    }

    return (
        <div className="flex flex-col my-20 mx-48 gap-10 min-h-[60vh]">
            <h2 className="text-2xl text-center font-bold">Messages</h2>
            <div className="flex rounded-md overflow-hidden h-[500px]">
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
