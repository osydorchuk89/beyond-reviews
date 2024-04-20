import axios from "axios";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { io } from "socket.io-client";
import { MessageBoxContext } from "./MessageBox";
import { useQuery } from "@tanstack/react-query";
import { getAuthStatus, getMessages, queryClient } from "../lib/requests";
import { Button } from "./Button";
import { SubmitHandler, useForm } from "react-hook-form";
import { BASE_API_URL, BASE_URL } from "../lib/urls";
import { concatStrings } from "../lib/utils";
import { AuthStatus } from "../lib/types";

interface MessageInput {
    message: string;
}

export const MessageBoxSingleUser = () => {
    const messagesRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        if (messagesRef && messagesRef.current) {
            const element = messagesRef.current;
            element.scroll({
                top: element.scrollHeight,
                left: 0,
            });
        }
    });

    const { user: otherUser, selectAllUsers } = useContext(MessageBoxContext);

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });
    const userId = authStatus!.userData!._id;

    useEffect(() => {
        const socket = io(BASE_URL);
        const roomId = concatStrings([userId, otherUser.id]);
        socket.emit("join-room", roomId);
        socket.on("new-message", () => {
            queryClient.invalidateQueries({
                queryKey: ["messages"],
            });
        });
    }, []);

    const { data: messages } = useQuery({
        queryKey: ["messages", { otherUser: otherUser.id }],
        queryFn: () => getMessages(userId, otherUser.id),
    });

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
                    recipient: otherUser.id,
                    message: data.message,
                    date,
                },
            });
            reset();
        } catch (error) {
            console.log(error);
        }
    };

    const messageStyle =
        "flex gap-2 justify-between px-4 py-1 rounded-lg relative";
    const timeStampStyle = "absolute right-1 bottom-1 text-[10px]";

    return (
        <div className="flex flex-col h-full justify-between items-center p-3">
            <p className="text-xl font-semibold">{otherUser.name}</p>
            <div
                className="h-[26rem] w-full flex flex-col justify-start gap-3 p-5 overflow-y-auto"
                ref={messagesRef}
            >
                {messages &&
                    messages!.map((message) => (
                        <div
                            className={
                                message.sender._id === userId
                                    ? messageStyle + " bg-amber-200  self-end"
                                    : messageStyle +
                                      " bg-amber-700 text-amber-50 self-start"
                            }
                            key={message._id}
                        >
                            <span className="mr-10">{message.text}</span>
                            <span
                                className={
                                    message.sender._id === userId
                                        ? timeStampStyle + " text-gray-700"
                                        : timeStampStyle + " text-gray-50"
                                }
                            >
                                {message.date}
                            </span>
                        </div>
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
                    onClick={selectAllUsers}
                >
                    Back to all messages
                </p>
            </div>
        </div>
    );
};
