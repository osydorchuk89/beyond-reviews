import { useEffect } from "react";
import { Popover } from "@headlessui/react";
import { MessageIcon } from "./icons/MessageIcon";
import { CircleIcon } from "./icons/CircleIcon";
import { MessageBoxAllUsers } from "./MessageBoxAllUsers";
import { MessageBoxSingleUser } from "./MessageBoxSingleUser";
import { MessageBoxTopPanel } from "./MessageBoxTopPanel";
import { BASE_URL } from "../lib/urls";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { AuthStatus, User } from "../lib/types";
import {
    getAllMessages,
    getAuthStatus,
    getUsers,
    queryClient,
} from "../lib/requests";
import { useAppSelector } from "../store/hooks";

const socket = io(BASE_URL);

export const MessageBox = () => {
    const { allUsers } = useAppSelector((state) => state.dialog);

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const { data: users } = useQuery<User[]>({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const userId = authStatus!.userData!._id;

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

    const hasUnreadMessages = allMessages?.find((usersMessages) =>
        usersMessages!.messages.find((message) => !message.read)
    );

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

    return (
        <Popover>
            <>
                <Popover.Button className="absolute top-7 right-[182px] cursor-pointer">
                    <MessageIcon />
                    <CircleIcon
                        className={`w-3 h-3 absolute -top-[2px] -right-[2px] ${hasUnreadMessages ? "" : "hidden"}`}
                    />
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
        </Popover>
    );
};
