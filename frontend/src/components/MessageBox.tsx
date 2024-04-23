import { useEffect, useState, createContext } from "react";
import { Popover } from "@headlessui/react";
import { MessageIcon } from "./icons/MessageIcon";
import { CloseIconAlt } from "./icons/CloseIconAlt";
import { CircleIcon } from "./icons/CircleIcon";
import { MessageBoxAllUsers } from "./MessageBoxAllUsers";
import { MessageBoxSingleUser } from "./MessageBoxSingleUser";
import { BackIcon } from "./BackIcon";
import { BASE_URL } from "../lib/urls";
import { io } from "socket.io-client";
import { useQuery } from "@tanstack/react-query";
import { AuthStatus } from "../lib/types";
import { getAuthStatus, queryClient } from "../lib/requests";

interface MessageBoxContextProps {
    user: { id: string; name: string };
    selectAllUsers: () => void;
    selectSingleUser: (userId: string, userName: string) => void;
}

const socket = io(BASE_URL);

export const MessageBoxContext = createContext({} as MessageBoxContextProps);

export const MessageBox = () => {
    const [user, setUsers] = useState({ id: "", name: "" });
    const [newMessage, setNewMessage] = useState<boolean>(false);

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });
    const userId = authStatus!.userData!._id;

    useEffect(() => {
        // const roomId = concatStrings([userId, otherUser.id]);
        // socket.emit("join-room", roomId);
        socket.emit("join-room", userId);
        socket.on("new-message", ({ from }) => {
            queryClient.invalidateQueries({
                queryKey: ["messages"],
            });
            if (from !== userId) {
                setNewMessage(true);
            }
        });
    }, [socket]);

    const messageBoxContextValue = {
        user,
        selectAllUsers: () => setUsers({ id: "", name: "" }),
        selectSingleUser: (userId: string, userName: string) =>
            setUsers({ id: userId, name: userName }),
    };

    return (
        <MessageBoxContext.Provider value={messageBoxContextValue}>
            <Popover>
                <Popover.Button
                    className="absolute top-7 right-[182px] cursor-pointer"
                    onClick={() => {
                        setUsers({ id: "", name: "" });
                        if (newMessage) {
                            setNewMessage(false);
                        }
                    }}
                >
                    <MessageIcon />
                    <CircleIcon
                        className={`w-3 h-3 absolute -top-[2px] -right-[2px] ${newMessage ? "" : "hidden"}`}
                    />
                </Popover.Button>
                <Popover.Panel className="flex flex-col absolute top-[90px] right-0 z-10 w-96 h-[87vh] bg-amber-50 rounded-md rounded-r-none shadow-md">
                    <div className="flex justify-between py-3 px-3">
                        {user.id === "" ? (
                            <button className="invisible" />
                        ) : (
                            <button>
                                <BackIcon
                                    className="w-8 h-8"
                                    handleClick={() =>
                                        setUsers({ id: "", name: "" })
                                    }
                                />
                            </button>
                        )}

                        <Popover.Button>
                            <CloseIconAlt className="w-8 h-8" />
                        </Popover.Button>
                    </div>
                    <hr className="h-px bg-amber-400 border-0" />
                    {user.id === "" ? (
                        <MessageBoxAllUsers />
                    ) : (
                        <MessageBoxSingleUser />
                    )}
                </Popover.Panel>
            </Popover>
        </MessageBoxContext.Provider>
    );
};
