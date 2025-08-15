import { useParams } from "react-router";

import { Message } from "../../../../lib/entities";

interface MessageProps {
    message: Message;
}

export const ChatHistoryMessage = ({ message }: MessageProps) => {
    const { userId } = useParams() as { userId: string };

    const messageStyle =
        "flex gap-2 justify-between px-4 py-1 rounded-lg relative";

    return (
        <>
            {message.dateSeparator && (
                <p className="text-center font-semibold">
                    {message.dateSeparator}
                </p>
            )}
            <div
                className={
                    message.senderId === userId
                        ? messageStyle + " bg-orange-200 self-end"
                        : message.wasRead
                        ? messageStyle + " bg-sky-200 self-start"
                        : messageStyle + " bg-sky-200 self-start"
                }
            >
                <span className="mr-6">{message.text}</span>
                <span className="absolute right-1 bottom-1 text-[10px]">
                    {new Date(message.date).toLocaleTimeString("default", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    })}
                </span>
            </div>
        </>
    );
};
