import { useLayoutEffect, useRef, useState } from "react";

import { UsersMessages } from "../../../../lib/entities";
import { ChatHistoryMessage } from "./ChatHistoryMessage";
import { LoadingSpinner } from "../../../ui/LoadingSpinner";
import { ChatMessageForm } from "./ChatMessageForm";

interface ChatHistoryProps {
    friendName: string;
    chatHistory: UsersMessages | null;
    onSendMessage: (text: string) => Promise<void>;
    loading: boolean;
}

export const ChatHistory = ({
    friendName,
    chatHistory,
    onSendMessage,
    loading,
}: ChatHistoryProps) => {
    const processedMessages = chatHistory
        ? chatHistory.messages.map((msg, index, arr) => {
              const dateObj = new Date(msg.date as string);
              const currentMessageDate = dateObj.toLocaleDateString("default", {
                  month: "short",
                  day: "numeric",
              });
              if (index === 0) {
                  msg.dateSeparator = currentMessageDate;
              } else {
                  const prevDateObj = new Date(arr[index - 1].date as string);
                  const previousMessageDate = prevDateObj.toLocaleDateString(
                      "default",
                      {
                          month: "short",
                          day: "numeric",
                      }
                  );
                  if (currentMessageDate !== previousMessageDate) {
                      msg.dateSeparator = currentMessageDate;
                  }
              }
              return msg;
          })
        : [];

    const [numberMessages, setNumberMessages] = useState(20);
    const [hasScrolled, setHasScrolled] = useState(false);

    const messagesRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        if (messagesRef.current && !hasScrolled) {
            const element = messagesRef.current;
            element.scroll({
                top: element.scrollHeight,
                left: 0,
            });
        }
    });

    const onScroll = () => {
        if (messagesRef.current && chatHistory) {
            const element = messagesRef.current;
            const elementHeight = element.scrollHeight;
            if (
                element.scrollTop === 0 &&
                chatHistory.messages.length > numberMessages
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
        <div className="flex flex-col justify-between w-3/4 shadow-lg bg-sky-100">
            {loading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <h3 className="text-lg px-2 py-5 text-center font-medium border-b-1 border-b-sky-500">
                        {friendName}
                    </h3>
                    <div
                        className="h-[26rem] w-full flex flex-col justify-start gap-3 p-5 overflow-y-auto"
                        ref={messagesRef}
                        onScroll={onScroll}
                    >
                        {processedMessages
                            .slice(-numberMessages)
                            .map((message) => (
                                <ChatHistoryMessage
                                    message={message}
                                    key={message.id}
                                />
                            ))}
                        {!chatHistory?.messages.length && (
                            <p className="text-center italic">
                                No messages yet
                            </p>
                        )}
                    </div>
                    <div className="w-full flex flex-col gap-5 mb-5">
                        <ChatMessageForm onSend={onSendMessage} />
                    </div>
                </>
            )}
        </div>
    );
};
