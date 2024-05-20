"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.root = void 0;
const user_1 = require("../models/user");
const message_1 = require("../models/message");
exports.root = {
    sendMessage: async (parent, args) => {
        console.log("efjbvjkfbvjfk");
        const messageText = args.messageData.message;
        const sender = user_1.User.findById(args.messageData.sender);
        const recipient = user_1.User.findById(args.messageData.recipient);
        const date = args.messageData.date.toString();
        const message = new message_1.Message({
            sender,
            recipient,
            message: messageText,
            date,
        });
        await message.save();
        return { ...message, _id: message._id.toString() };
    },
};
