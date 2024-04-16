import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../lib/requests";
import { useAppSelector } from "../store/hooks";
import { UserIcon } from "./UserIcon";
import { User } from "../lib/types";
import { MessageBoxContext } from "./MessageBox";

export const MessageBoxAllUsers = () => {
    const { selectSingleUser } = useContext(MessageBoxContext);
    const { userData } = useAppSelector((state) => state.auth);
    const userId = userData!._id;
    const { data } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const users = data as User[];

    return (
        <div>
            {data &&
                users
                    .filter((user) => user._id !== userId)
                    .map((user) => (
                        <div
                            key={user._id}
                            className="flex flex-col"
                            onClick={() => selectSingleUser(user._id)}
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
