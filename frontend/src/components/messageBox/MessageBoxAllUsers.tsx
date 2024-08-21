import { useQuery } from "@tanstack/react-query";
import {
    getAuthStatus,
    getMessages,
    getAllMessages,
    queryClient,
    getUser,
} from "../../lib/requests";
import { UserIcon } from "../icons/UserIcon";
import { AuthStatus, User } from "../../lib/types";
import { useAppDispatch } from "../../store/hooks";
import { messageBoxActions } from "../../store/index";

export const MessageBoxAllUsers = () => {
    const dispatch = useAppDispatch();

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const userId = authStatus!.userData!._id;

    const { data: user } = useQuery<User>({
        queryKey: ["users", { user: userId }],
        queryFn: () => getUser(userId),
    });

    const userFriends = user!.friends as User[];

    const { data: allMessages } = useQuery({
        queryKey: ["messages", { user: userId }],
        queryFn: () => {
            const userPairs = userFriends.map((user) => ({
                senderId: user._id,
                recipientId: userId,
            }));
            return getAllMessages(userPairs!);
        },
    });

    const prefetchMessages = (otherUserId: string) => {
        queryClient.prefetchQuery({
            queryKey: ["messages", { user: userId, otherUser: otherUserId }],
            queryFn: () => getMessages(userId, otherUserId),
            staleTime: 1000,
        });
    };

    const messageSectionStyle =
        "flex justify-start items-center gap-2 w-full hover:bg-amber-200 cursor-pointer px-2 py-5";
    const messageSectionStyleUnread = messageSectionStyle + " font-bold";

    return (
        <div>
            {userFriends
                .filter((user) => user._id !== userId)
                .map((user) => {
                    const userMessages = allMessages?.find(
                        (messages) =>
                            messages!.sender === user._id &&
                            messages!.recipient === userId
                    );
                    const hasUnreadMessages = userMessages?.messages?.find(
                        (message) =>
                            message.sender._id !== userId && !message.read
                    );
                    return (
                        <div
                            key={user._id}
                            className="flex flex-col"
                            onMouseEnter={() => {
                                prefetchMessages(user._id);
                            }}
                            onFocus={() => {
                                prefetchMessages(user._id);
                            }}
                            onClick={() => {
                                const userName = `${user.firstName} ${user.lastName}`;
                                dispatch(
                                    messageBoxActions.selectSingleUser({
                                        id: user._id,
                                        name: userName,
                                    })
                                );
                            }}
                        >
                            <div
                                className={
                                    hasUnreadMessages
                                        ? messageSectionStyleUnread
                                        : messageSectionStyle
                                }
                            >
                                <UserIcon />
                                <span>
                                    {user.firstName} {user.lastName}
                                </span>
                            </div>
                            <hr className="h-px bg-amber-400 border-0" />
                        </div>
                    );
                })}
        </div>
    );
};
