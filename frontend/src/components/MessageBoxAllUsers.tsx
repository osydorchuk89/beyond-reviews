import { useQuery } from "@tanstack/react-query";
import {
    getAuthStatus,
    getMessages,
    getAllMessages,
    getUsers,
    queryClient,
} from "../lib/requests";
import { UserIcon } from "./icons/UserIcon";
import { AuthStatus, User } from "../lib/types";
import { useAppDispatch } from "../store/hooks";
import { dialogActions } from "../store/index";

export const MessageBoxAllUsers = () => {
    const dispatch = useAppDispatch();

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const userId = authStatus!.userData!._id;

    const { data: users } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const { data: allMessages } = useQuery({
        queryKey: ["messages"],
        queryFn: () => {
            const userPairs = users!.map((user) => ({
                senderId: user._id,
                recipientId: userId,
            }));
            return getAllMessages(userPairs!);
        },
    });

    const prefetchMessages = (otherUserId: string) => {
        queryClient.ensureQueryData({
            queryKey: ["messages", { user: userId, otherUser: otherUserId }],
            queryFn: () => getMessages(userId, otherUserId),
            // Prefetch only fires when data is older than the staleTime,
            // so in a case like this you definitely want to set one
            staleTime: 1000,
        });
    };

    const messageSectionStyle =
        "flex justify-start items-center gap-2 w-full hover:bg-amber-200 cursor-pointer px-2 py-5";
    const messageSectionStyleUnread = messageSectionStyle + " font-bold";

    return (
        <div>
            {users!
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
                            onClick={() => {
                                const userName = `${user.firstName} ${user.lastName}`;
                                dispatch(
                                    dialogActions.selectSingleUser({
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
