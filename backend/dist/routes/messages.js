"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRouter = void 0;
const express_1 = require("express");
const message_1 = require("../models/message");
const user_1 = require("../models/user");
const socket_1 = require("../socket");
exports.messageRouter = (0, express_1.Router)();
exports.messageRouter.get("/", async (req, res) => {
    try {
        const sender = req.query.sender;
        const recipient = req.query.recipient;
        const messagesSent = await message_1.Message.find({
            sender: sender,
            recipient: recipient,
        })
            .populate("sender", ["firstName", "lastName"])
            .populate("recipient", ["firstName", "lastName"]);
        const messagesReceived = await message_1.Message.find({
            sender: recipient,
            recipient: sender,
        })
            .populate("sender", ["firstName", "lastName"])
            .populate("recipient", ["firstName", "lastName"]);
        const allMessages = messagesSent
            .concat(messagesReceived)
            .sort((a, b) => {
            return new Date(a.date).valueOf() - new Date(b.date).valueOf();
        });
        res.send(allMessages);
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
exports.messageRouter.post("/", async (req, res) => {
    const messageText = req.body.message;
    const date = req.body.date.toString();
    const sender = await user_1.User.findById(req.body.sender);
    const recipient = await user_1.User.findById(req.body.recipient);
    try {
        const message = new message_1.Message({
            sender: sender._id,
            recipient: recipient._id,
            text: messageText,
            date,
            read: false,
        });
        await message.save();
        if (sender && recipient) {
            sender.sentMessages.push(message._id);
            recipient.receivedMessages.push(message._id);
            await sender.save();
            await recipient.save();
        }
        const senderId = sender._id.toString();
        const recipientId = recipient._id.toString();
        const io = socket_1.socket.getIO();
        // io.on("message-sent", ({ data, to }) => {
        //     io.to(to).emit("new-message", { data, from: senderId });
        // });
        io.to(recipientId)
            .to(senderId)
            .emit("new-message", { data: message, from: senderId });
        res.status(200).send();
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
exports.messageRouter.put("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;
        await message_1.Message.findByIdAndUpdate(messageId, { read: true });
        res.status(200).send();
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
