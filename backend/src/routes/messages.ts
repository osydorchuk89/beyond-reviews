import { Router } from "express";
import { Message } from "../models/message";
import { User } from "../models/user";
import { socket } from "../socket";
import { concatStrings } from "../util/utils";

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
    const sender = await User.findById(req.body.sender);
    const recipient = await User.findById(req.body.recipient);
    const date = req.body.date.toString();

    try {
        const message = new Message({
            sender,
            recipient,
            text: messageText,
            date,
        });
        await message.save();
        const senderId = sender!._id.toString();
        const recipientId = recipient!._id.toString();
        const roomId = concatStrings([senderId, recipientId]);
        socket.getIO().to(roomId).emit("new-message");
        res.status(200).send();
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
});
