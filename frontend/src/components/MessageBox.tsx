import { useState, createContext } from "react";
import { Popover } from "@headlessui/react";
import { MessageIcon } from "./MessageIcon";
import { CloseIconAlt } from "./CloseIconAlt";
import { MessageBoxAllUsers } from "./MessageBoxAllUsers";
import { MessageBoxSingleUser } from "./MessageBoxSingleUser";
import { BackIcon } from "./BackIcon";

interface MessageBoxContextProps {
    user: string;
    userName: string;
    selectAllUsers: () => void;
    selectSingleUser: (userId: string) => void;
    selectUserName: (userName: string) => void;
}

export const MessageBoxContext = createContext({} as MessageBoxContextProps);

export const MessageBox = () => {
    const [user, setUsers] = useState("all");
    const [userName, setUserName] = useState("");

    const messageBoxContextValue = {
        user,
        userName,
        selectAllUsers: () => setUsers("all"),
        selectSingleUser: (userId: string) => setUsers(userId),
        selectUserName: (userName: string) => setUserName(userName),
    };

    return (
        <MessageBoxContext.Provider value={messageBoxContextValue}>
            <Popover>
                <Popover.Button
                    className="absolute top-7 right-[182px] cursor-pointer"
                    onClick={() => setUsers("all")}
                >
                    <MessageIcon />
                </Popover.Button>
                <Popover.Panel className="flex flex-col absolute top-[90px] right-0 z-10 w-96 h-[87vh] bg-amber-50 rounded-md rounded-r-none shadow-md">
                    <div className="flex justify-between py-3 px-3">
                        {user === "all" ? (
                            <button className="invisible" />
                        ) : (
                            <button>
                                <BackIcon
                                    className="w-8 h-8"
                                    handleClick={() => setUsers("all")}
                                />
                            </button>
                        )}

                        <Popover.Button>
                            <CloseIconAlt className="w-8 h-8" />
                        </Popover.Button>
                    </div>
                    <hr className="h-px bg-amber-400 border-0" />
                    {user === "all" ? (
                        <MessageBoxAllUsers />
                    ) : (
                        <MessageBoxSingleUser />
                    )}
                </Popover.Panel>
            </Popover>
        </MessageBoxContext.Provider>
    );
};
