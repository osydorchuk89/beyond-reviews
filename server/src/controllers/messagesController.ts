import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUserMessages = async (req: Request, res: Response) => {
    try {
        const senderId = req.query.senderId as string;
        const recipientId = req.query.recipientId as string;

        const allMessages = await prisma.message.findMany({
            where: {
                OR: [
                    {
                        senderId: senderId,
                        recipientId: recipientId,
                    },
                    {
                        senderId: recipientId,
                        recipientId: senderId,
                    },
                ],
            },
            include: {
                sender: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: {
                date: "asc",
            },
        });

        res.status(200).send(allMessages);
    } catch (error) {
        res.status(500).send({ message: "Could not fetch messages", error });
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
        res.status(500).send({ message: "Could not post message", error });
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
        res.status(500).send({
            message: "Could not mark message as read",
            error,
        });
    }
};
