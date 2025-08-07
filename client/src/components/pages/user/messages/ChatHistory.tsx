import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";

import { useAppDispatch, useAppSelector } from "../../../../store/hooks";
import { UsersMessages } from "../../../../lib/entities";
import { getChatHistory, sendMessage } from "../../../../lib/actions";
import { triggerMessageEvent } from "../../../../store";
import { ChatHistoryMessage } from "./ChatHistoryMessage";
import { BaseButton } from "../../../ui/BaseButton";


interface ChatHistoryProps {
    friendId: string;
    friendName: string;
}

export const ChatHistory = ({ friendId, friendName }: ChatHistoryProps) => {
    const { userId } = useParams() as { userId: string };
    const { register, handleSubmit, reset } = useForm<{ text: string }>();

    const messageEvent = useAppSelector((state) => state.messageEvent);
    const [chatHistory, setChatHistory] = useState<UsersMessages | null>();

    useEffect(() => {
        if (friendId) {
            const fetchUserChatHistory = async () => {
                const userChatHistory = await getChatHistory(userId, friendId);
                if (userChatHistory) {
                    setChatHistory(userChatHistory);
                }
            };
            fetchUserChatHistory();
        }
    }, [friendId, messageEvent]);

    if (chatHistory) {
        chatHistory.messages.map((msg, index, arr) => {
            const currentMessageDate = (msg.date as string).split(",")[0];
            if (index === 0) {
                msg.dateSeparator = currentMessageDate;
            } else {
                const previousMessageDate = (
                    arr[index - 1].date as string
                ).split(",")[0];
                if (currentMessageDate !== previousMessageDate) {
                    msg.dateSeparator = currentMessageDate;
                }
            }
            return msg;
        });
    }

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

    const onScroll = () => {
        if (messagesRef.current) {
            const element = messagesRef.current;
            const elementHeight = element.scrollHeight;
            if (
                element.scrollTop === 0 &&
                chatHistory!.messages.length > numberMessages
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

    const dispatch = useAppDispatch();

    const handleSendMessage = handleSubmit(async (data) => {
        const date = new Date();
        await sendMessage(userId, friendId, data.text);
        dispatch(
            triggerMessageEvent(`new message event at ${date.toString()}`)
        );
        reset();
    });

    const messagesRef = useRef<HTMLDivElement>(null);

    return (
        <div className="flex flex-col justify-between w-3/4 shadow-lg bg-sky-100">
            <h3 className="text-lg px-2 py-5 text-center font-medium border-b-1 border-b-sky-500">
                {friendName}
            </h3>
            <div
                className="h-[26rem] w-full flex flex-col justify-start gap-3 p-5 overflow-y-auto"
                ref={messagesRef}
                onScroll={onScroll}
            >
                {chatHistory &&
                    chatHistory.messages
                        .slice(-numberMessages)
                        .map((message) => (
                            <ChatHistoryMessage
                                message={message}
                                key={message.id}
                            />
                        ))}
                {!chatHistory?.messages.length && (
                    <p className="text-center italic">No messages yet</p>
                )}
            </div>
            <div className="w-full flex flex-col gap-5 mb-5">
                <form
                    noValidate
                    onSubmit={handleSendMessage}
                    className="flex gap-5 mx-5 justify-between items-end"
                >
                    <input
                        {...register("text", {
                            required: true,
                        })}
                        className="border border-gray-700 rounded-md p-3 focus:border-orange-900 w-full"
                        name="text"
                        placeholder="type your message here"
                    />
                    <BaseButton style="orange" text="SEND" type="submit" />
                </form>
            </div>
        </div>
    );
};
