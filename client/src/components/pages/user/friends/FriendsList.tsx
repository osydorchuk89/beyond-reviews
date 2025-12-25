import { Friend } from "../../../../lib/entities";
import { BaseLink } from "../../../ui/BaseLink";

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
                            <BaseLink to={`/users/${friend.id}/profile`}>
                                {`${friend.firstName} ${friend.lastName}`}
                            </BaseLink>
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
