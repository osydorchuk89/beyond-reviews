import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    getAuthStatus,
    getMessages,
    getUsers,
    queryClient,
} from "../lib/requests";
import { UserIcon } from "./UserIcon";
import { AuthStatus, User } from "../lib/types";
import { MessageBoxContext } from "./MessageBox";

export const MessageBoxAllUsers = () => {
    const { selectSingleUser } = useContext(MessageBoxContext);
    const { data: users } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const userId = authStatus!.userData!._id;

    const prefetchMessages = (otherUserId: string) => {
        queryClient.prefetchQuery({
            queryKey: ["messages", { otherUser: otherUserId }],
            queryFn: () => getMessages(userId, otherUserId),
            // Prefetch only fires when data is older than the staleTime,
            // so in a case like this you definitely want to set one
            // staleTime: 60000,
        });
    };

    return (
        <div>
            {users &&
                users
                    .filter((user) => user._id !== userId)
                    .map((user) => (
                        <div
                            key={user._id}
                            className="flex flex-col"
                            onMouseEnter={() => prefetchMessages(user._id)}
                            onClick={() => {
                                const userName = `${user.firstName} ${user.lastName}`;
                                selectSingleUser(user._id, userName);
                            }}
                        >
                            <div className="flex justify-start items-center gap-2 w-full hover:bg-amber-200 cursor-pointer px-2 py-5">
                                <UserIcon />
                                <span>
                                    {user.firstName} {user.lastName}
                                </span>
                            </div>
                            <hr className="h-px bg-amber-400 border-0" />
                        </div>
                    ))}
        </div>
    );
};
