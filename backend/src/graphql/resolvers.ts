import { User } from "../models/user";
import { Message } from "../models/message";

interface ArgsType {
    messageData: {
        sender: String;
        recipient: String;
        message: String;
        date: String;
    };
}

export const root = {
    sendMessage: async (parent: any, args: ArgsType) => {
        console.log("efjbvjkfbvjfk");
        const messageText = args.messageData.message;
        const sender = User.findById(args.messageData.sender);
        const recipient = User.findById(args.messageData.recipient);
        const date = args.messageData.date.toString();

        const message = new Message({
            sender,
            recipient,
            message: messageText,
            date,
        });

        await message.save();
        return { ...message, _id: message._id.toString() };
    },
};
