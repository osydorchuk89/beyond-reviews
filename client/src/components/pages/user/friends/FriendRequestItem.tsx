import { BaseLink } from "../../../ui/BaseLink";
import { BaseButton } from "../../../ui/BaseButton";

interface FriendRequestItemProps {
    userId: string;
    firstName: string;
    lastName: string;
    photo: string;
    showAcceptButton?: boolean;
    onAccept?: () => void;
}

export const FriendRequestItem = ({
    userId,
    firstName,
    lastName,
    photo,
    showAcceptButton = false,
    onAccept,
}: FriendRequestItemProps) => {
    return (
        <li className="flex items-center justify-between text-lg border-b border-b-sky-700 py-2">
            <div className="flex">
                <img
                    src={photo}
                    className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                />
                <BaseLink to={`/users/${userId}/profile`}>
                    {`${firstName} ${lastName}`}
                </BaseLink>
            </div>
            {showAcceptButton && onAccept && (
                <BaseButton style="sky" handleClick={onAccept}>
                    Accept friend request
                </BaseButton>
            )}
        </li>
    );
};
