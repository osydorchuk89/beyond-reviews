import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserMessages = async (req: Request, res: Response) => {
    try {
        const senderId = req.query.senderId as string;
        const recipientId = req.query.recipientId as string;
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
                    return (
                        new Date(a.date).valueOf() - new Date(b.date).valueOf()
                    );
                });
            res.status(200).send(allMessages);
        } else {
            res.status(500).send({
                message: "Could not find messages",
            });
        }
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
};

export const postMessage = async (req: Request, res: Response) => {
    const text = req.body.text;
    const date = req.body.date.toString();
    const senderId = req.body.senderId;
    const recipientId = req.body.recipientId;

    try {
        const message = await prisma.message.create({
            data: {
                senderId,
                recipientId,
                text,
                date,
                wasRead: false,
            },
        });
        res.status(200).send(message);
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
};

export const markMessageAsRead = async (req: Request, res: Response) => {
    try {
        const { messageId } = req.params;
        await prisma.message.update({
            where: { id: messageId },
            data: { wasRead: true },
        });
        res.status(200).send();
    } catch (error: any) {
        res.status(500).send({ message: error.message });
    }
};
