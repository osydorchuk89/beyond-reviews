"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../../generated/prisma");
exports.messageRouter = (0, express_1.Router)();
const prisma = new prisma_1.PrismaClient();
// get all user messages
exports.messageRouter.get("/", async (req, res) => {
    try {
        const senderId = req.query.senderId;
        const recipientId = req.query.recipientId;
        const sentMessages = await prisma.message.findMany({
            where: {
                senderId: senderId,
                recipientId: recipientId,
            },
            include: {
                sender: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        const receivedMessages = await prisma.message.findMany({
            where: {
                senderId: recipientId,
                recipientId: senderId,
            },
            include: {
                sender: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (sentMessages && receivedMessages) {
            const allMessages = sentMessages
                .concat(receivedMessages)
                .sort((a, b) => {
                return (new Date(a.date).valueOf() - new Date(b.date).valueOf());
            });
            res.status(200).send(allMessages);
        }
        else {
            res.status(500).send({
                message: "Could not find messages",
            });
        }
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// send a message
exports.messageRouter.post("/", async (req, res) => {
    const text = req.body.text;
    const date = req.body.date.toString();
    const senderId = req.body.senderId;
    const recipientId = req.body.recipientId;
    try {
        await prisma.message.create({
            data: {
                senderId,
                recipientId,
                text,
                date,
                wasRead: false,
            },
        });
        res.status(200).send();
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// mark a message as read
exports.messageRouter.put("/:messageId", async (req, res) => {
    try {
        const { messageId } = req.params;
        await prisma.message.update({
            where: { id: messageId },
            data: { wasRead: true },
        });
        res.status(200).send();
    }
    catch (error) {
        res.status(500).send({ message: error.message });
    }
});
