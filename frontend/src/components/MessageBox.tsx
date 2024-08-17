import { useEffect } from "react";
import { Popover } from "@headlessui/react";
import { MessageIcon } from "./icons/MessageIcon";
import { MessageBoxAllUsers } from "./MessageBoxAllUsers";
import { MessageBoxSingleUser } from "./MessageBoxSingleUser";
import { MessageBoxTopPanel } from "./MessageBoxTopPanel";
import { BASE_URL } from "../lib/urls";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { AuthStatus } from "../lib/types";
import { getAuthStatus, getUser, queryClient } from "../lib/requests";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { messageBoxActions } from "../store";

const socket = io(BASE_URL);

export const MessageBox = () => {
    const { allUsers } = useAppSelector((state) => state.messageBox);
    const dispatch = useAppDispatch();

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const userId = authStatus!.userData!._id;

    // const { data: user } = useQuery<User>({
    //     queryKey: ["users", { user: userId }],
    //     queryFn: () => getUser(userId),
    // });

    // const userFriends = user!.friends as User[];

    // const { data: allMessages } = useQuery({
    //     queryKey: ["messages", { user: userId }],
    //     queryFn: () => {
    //         const userPairs = userFriends.map((user) => ({
    //             senderId: user._id,
    //             recipientId: userId,
    //         }));
    //         return getAllMessages(userPairs!);
    //     },
    // });

    // const hasUnreadMessages = allMessages?.find((usersMessages) =>
    //     usersMessages!.messages.find(
    //         (message) => message.sender._id !== userId && !message.read
    //     )
    // );

    useEffect(() => {
        socket.emit("join-room", userId);
        socket.on("new-message", ({ data, from }) => {
            if (from !== userId) {
                queryClient.invalidateQueries({
                    queryKey: ["messages", { user: userId, otherUser: from }],
                });
            } else {
                queryClient.invalidateQueries({
                    queryKey: [
                        "messages",
                        { user: userId, otherUser: data.recipient },
                    ],
                });
            }
        });
    }, [socket]);

    const prefetchUser = (userId: string) => {
        queryClient.prefetchQuery({
            queryKey: ["users", { user: userId }],
            queryFn: () => getUser(userId),
            // Prefetch only fires when data is older than the staleTime,
            // so in a case like this you definitely want to set one
            staleTime: 1000,
        });
    };

    return (
        <Popover>
            {({ open }) => (
                <>
                    <Popover.Button
                        className="absolute top-7 right-[182px] cursor-pointer"
                        onClick={() => {
                            open
                                ? dispatch(messageBoxActions.close())
                                : dispatch(messageBoxActions.open());
                        }}
                        onMouseEnter={() => {
                            !open && prefetchUser(userId);
                        }}
                        onFocus={() => {
                            !open && prefetchUser(userId);
                        }}
                    >
                        <MessageIcon />
                        {/* <CircleIcon
                            className={`w-3 h-3 absolute -top-[2px] -right-[2px] ${hasUnreadMessages ? "" : "hidden"}`}
                        /> */}
                    </Popover.Button>
                    <Popover.Panel className="flex flex-col absolute top-[90px] right-0 z-10 w-96 h-[87vh] bg-amber-50 rounded-md rounded-r-none shadow-md">
                        <MessageBoxTopPanel />
                        <hr className="h-px bg-amber-400 border-0" />
                        {allUsers ? (
                            <MessageBoxAllUsers />
                        ) : (
                            <MessageBoxSingleUser />
                        )}
                    </Popover.Panel>
                </>
            )}
        </Popover>
    );
};
