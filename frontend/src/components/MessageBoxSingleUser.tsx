import { useContext } from "react";
import { MessageBoxContext } from "./MessageBox";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../lib/requests";
import { User } from "../lib/types";

export const MessageBoxSingleUser = () => {
    const { user: userId, selectAllUsers } = useContext(MessageBoxContext);
    const { data } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const userData = (data as User[]).find((user) => user._id === userId)!;

    return (
        <div className="h-full flex flex-col justify-between items-center py-5">
            <p className="text-xl">
                {userData.firstName} {userData.lastName}
            </p>
            <a
                className="hover:underline cursor-pointer"
                onClick={selectAllUsers}
            >
                Back to all messages
            </a>
        </div>
    );
};
