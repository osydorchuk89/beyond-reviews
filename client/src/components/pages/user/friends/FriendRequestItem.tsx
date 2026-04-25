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
        <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-base sm:text-lg border-b border-b-sky-700 py-3">
            <div className="flex min-w-0">
                <img
                    src={photo}
                    className="object-cover object-top w-8 h-8 rounded-full self-center mr-2 shrink-0"
                    alt="user photo"
                />
                <span className="break-words">
                    <BaseLink to={`/users/${userId}/profile`}>
                        {`${firstName} ${lastName}`}
                    </BaseLink>
                </span>
            </div>
            {showAcceptButton && onAccept && (
                <div className="w-full sm:w-auto text-center">
                    <BaseButton style="sky" handleClick={onAccept}>
                        Accept friend request
                    </BaseButton>
                </div>
            )}
        </li>
    );
};
