import { Friend } from "../../../../lib/entities";
import { NavLink } from "../../../ui/NavLink";

interface FriendsListProps {
    friends: Friend[];
    isSameUser: boolean;
    profileUserName: string;
}

export const FriendsList = ({
    friends,
    isSameUser,
    profileUserName,
}: FriendsListProps) => {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-xl font-medium text-center">Friends</p>
            {friends.length > 0 ? (
                <ul className="flex flex-col gap-5">
                    {friends.map((friend) => (
                        <li
                            key={friend.id}
                            className="flex flex-col text-lg p-5 rounded-lg shadow-lg bg-sky-100 gap-8"
                        >
                            <NavLink
                                text={`${friend.firstName} ${friend.lastName}`}
                                to={`/users/${friend.id}/profile`}
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center">
                    {isSameUser ? "You have" : `${profileUserName} has`} no
                    friends so far
                </p>
            )}
        </div>
    );
};
