import axios from "axios";
import { useLayoutEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    getAuthStatus,
    getMessages,
    markMessageRead,
    queryClient,
} from "../lib/requests";
import { Button } from "./Button";
import { MessageBoxItem } from "./MessageBoxItem";
import { SubmitHandler, useForm } from "react-hook-form";
import { BASE_API_URL } from "../lib/urls";
import { AuthStatus, Message } from "../lib/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { dialogActions } from "../store";

interface MessageInput {
    message: string;
}

export const MessageBoxSingleUser = () => {
    const messagesRef = useRef<HTMLDivElement>(null);
    const [numberMessages, setNumberMessages] = useState(20);
    const [hasScrolled, setHasScrolled] = useState(false);

    useLayoutEffect(() => {
        if (messagesRef && messagesRef.current && !hasScrolled) {
            const element = messagesRef.current;
            element.scroll({
                top: element.scrollHeight,
                left: 0,
            });
        }
    });

    const { name: otherUserName, id: otherUserId } = useAppSelector(
        (state) => state.dialog.otherUser!
    );
    const dispatch = useAppDispatch();

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });
    const userId = authStatus!.userData!._id;

    const { data: usersMessages } = useQuery({
        queryKey: ["messages", { user: userId, otherUser: otherUserId }],
        queryFn: () => getMessages(userId, otherUserId),
    });

    usersMessages?.messages.map((msg, index, arr) => {
        const currentMessageDate = (msg.date as string).split(",")[0];
        if (index === 0) {
            msg.dateSeparator = currentMessageDate;
        } else {
            const previousMessageDate = (arr[index - 1].date as string).split(
                ","
            )[0];
            if (currentMessageDate !== previousMessageDate) {
                msg.dateSeparator = currentMessageDate;
            }
        }
        return msg;
    });

    const { mutate: markMessageAsRead } = useMutation({
        mutationFn: async (messageId: string) =>
            await markMessageRead(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [
                    "messages",
                    // { user: userId, otherUser: otherUserId },
                ],
            });
        },
    });

    const markMessagesAsRead = (messages: Message[]) => {
        messages.forEach((msg) => {
            if (!msg.read && msg.sender._id !== userId) {
                markMessageAsRead(msg._id);
            }
        });
    };

    const { register, handleSubmit, reset } = useForm<MessageInput>();

    const onSubmit: SubmitHandler<MessageInput> = async (data) => {
        const date = new Date();
        try {
            await axios({
                method: "post",
                url: BASE_API_URL + "messages",
                headers: {
                    "Content-Type": "application/json",
                },
                data: {
                    sender: userId,
                    recipient: otherUserId,
                    message: data.message,
                    date,
                },
            });
            reset();
        } catch (error) {
            console.log(error);
        }
    };

    const onScroll = () => {
        if (messagesRef.current) {
            const element = messagesRef.current;
            const elementHeight = element.scrollHeight;
            if (
                element.scrollTop === 0 &&
                usersMessages &&
                usersMessages.messages.length > numberMessages
            ) {
                setTimeout(() => {
                    element.scroll({
                        top: element.scrollHeight - elementHeight,
                        left: 0,
                    });
                }, 1);
                setNumberMessages((prevState) => prevState + 20);
                setHasScrolled(true);
            }
        }
    };

    return (
        <div
            className="flex flex-col h-full justify-between items-center p-3"
            onClick={() => markMessagesAsRead(usersMessages!.messages)}
        >
            <p className="text-xl font-semibold">{otherUserName}</p>
            <div
                className="h-[26rem] w-full flex flex-col justify-start gap-3 p-5 overflow-y-auto"
                ref={messagesRef}
                onScroll={onScroll}
            >
                {usersMessages!.messages
                    .slice(-numberMessages)
                    .map((message) => (
                        <MessageBoxItem message={message} key={message._id} />
                    ))}
            </div>
            <div className="w-full flex flex-col gap-5">
                <form
                    noValidate
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex gap-5 mx-5"
                >
                    <input
                        {...register("message", {
                            required: true,
                        })}
                        className="w-full border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                        type="text"
                        placeholder="type your message here"
                    />
                    <Button
                        style="px-4 py-1 rounded-md text-amber-50 bg-amber-700 hover:bg-amber-900 text-md uppercase"
                        text="Send"
                        type="submit"
                    />
                </form>
                <p
                    className="text-center hover:underline cursor-pointer"
                    onClick={() => {
                        dispatch(dialogActions.selectAllUSers());
                    }}
                >
                    Back to all messages
                </p>
            </div>
        </div>
    );
};
