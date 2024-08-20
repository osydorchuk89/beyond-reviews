import { Router } from "express";
import { Message } from "../models/message";
import { User } from "../models/user";
import { socket } from "../socket";

export const messageRouter = Router();

messageRouter.get("/", async (req, res) => {
    try {
        const sender = req.query.sender;
        const recipient = req.query.recipient;
        const messagesSent = await Message.find({
            sender: sender,
            recipient: recipient,
        })
            .populate("sender", ["firstName", "lastName"])
            .populate("recipient", ["firstName", "lastName"]);
        const messagesReceived = await Message.find({
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
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

messageRouter.post("/", async (req, res) => {
    const messageText = req.body.message;
    const date = req.body.date.toString();
    const sender = await User.findById(req.body.sender);
    const recipient = await User.findById(req.body.recipient);

    try {
        const message = new Message({
            sender: sender!._id,
            recipient: recipient!._id,
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
        const senderId = sender!._id.toString();
        const recipientId = recipient!._id.toString();
        const io = socket.getIO();
        // io.on("message-sent", ({ data, to }) => {
        //     io.to(to).emit("new-message", { data, from: senderId });
        // });
        io.to(recipientId)
            .to(senderId)
            .emit("new-message", { data: message, from: senderId });
        res.status(200).send();
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});

messageRouter.put("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;
        await Message.findByIdAndUpdate(messageId, { read: true });
        res.status(200).send();
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});
