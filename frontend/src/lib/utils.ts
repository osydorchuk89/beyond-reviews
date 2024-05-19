import { useMutation } from "@tanstack/react-query";
import { markMessageRead } from "./requests";
import { Message } from "./types";

export const markMessagesAsRead = (messages: Message[]) => {
    const { mutate: markMessageAsRead } = useMutation({
        mutationFn: async (messageId: string) =>
            await markMessageRead(messageId),
    });

    messages.forEach((msg) => {
        if (!msg.read) {
            markMessageAsRead(msg._id);
        }
    });
};
