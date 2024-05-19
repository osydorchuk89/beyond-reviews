import { useQuery } from "@tanstack/react-query";
import { getAuthStatus } from "../lib/requests";
import { AuthStatus, Message } from "../lib/types";

interface MessageProps {
    message: Message;
}

export const MessageItem = ({ message }: MessageProps) => {
    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });
    const userId = authStatus!.userData!._id;

    const messageStyle =
        "flex gap-2 justify-between px-4 py-1 rounded-lg relative";

    return (
        <div
            className={
                message.sender._id === userId
                    ? messageStyle + " bg-amber-200 self-end"
                    : message.read
                      ? messageStyle + " bg-slate-200 self-start"
                      : messageStyle + " bg-slate-200 self-start font-bold"
            }
        >
            <span className="mr-10">{message.text}</span>
            <span className="absolute right-1 bottom-1 text-[10px]">
                {message.date as string}
            </span>
        </div>
    );
};
