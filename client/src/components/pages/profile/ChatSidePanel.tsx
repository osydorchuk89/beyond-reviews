import { Friend, User } from "../../../lib/entities";

interface ChatSidePanelProps {
    user: User;
    selectedFriend: Friend | null;
    setSelectedFriend: (friend: Friend) => void;
}

export const ChatSidePanel = ({
    user,
    selectedFriend,
    setSelectedFriend,
}: ChatSidePanelProps) => {
    const baseFriendItemStyle =
        "flex justify-start gap-2 cursor-pointer px-2 py-5 border-b-1 border-b-sky-500 hover:bg-sky-500";

    return (
        <div className="flex flex-col w-1/4 shadow-lg overflow-y-auto">
            <h3 className="text-xl px-2 py-5 bg-sky-800 text-white text-center font-medium">
                Friends
            </h3>
            <ul className="flex flex-col bg-sky-200 flex-1">
                {user.friends.map((friend) => (
                    <li
                        key={friend.id}
                        className={
                            selectedFriend?.id === friend.id
                                ? baseFriendItemStyle + " bg-sky-500"
                                : baseFriendItemStyle
                        }
                        onClick={() => setSelectedFriend(friend)}
                    >
                        <p>
                            {friend.firstName} {friend.lastName}
                        </p>
                    </li>
                ))}
            </ul>
        </div>
    );
};
