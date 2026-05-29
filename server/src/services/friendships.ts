import { PrismaClient } from "@prisma/client";

import { ServiceError } from "./errors";

interface FriendshipArgs {
    userId: string;
    otherUserId: string;
}

export const sendFriendRequestToUser = async (
    prisma: PrismaClient,
    { userId, otherUserId }: FriendshipArgs,
) => {
    const sender = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!sender) {
        throw new ServiceError(404, "Sender user not found");
    }

    const recipient = await prisma.user.findUnique({
        where: { id: otherUserId },
    });

    if (!recipient) {
        throw new ServiceError(404, "Recipient user not found");
    }

    const friendRequest = await prisma.friendRequest.findUnique({
        where: {
            sentUserId_receivedUserId: {
                sentUserId: userId,
                receivedUserId: otherUserId,
            },
        },
    });

    if (friendRequest) {
        throw new ServiceError(
            409,
            "User has already received a friend request",
        );
    }

    await prisma.friendRequest.create({
        data: {
            sentUserId: userId,
            receivedUserId: otherUserId,
        },
    });
};

export const acceptFriendRequestFromUser = async (
    prisma: PrismaClient,
    { userId, otherUserId }: FriendshipArgs,
) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ServiceError(404, "User not found");
    }

    const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
    });

    if (!otherUser) {
        throw new ServiceError(404, "Other user not found");
    }

    const friendRequest = await prisma.friendRequest.findUnique({
        where: {
            sentUserId_receivedUserId: {
                sentUserId: otherUserId,
                receivedUserId: userId,
            },
        },
    });

    if (!friendRequest) {
        throw new ServiceError(404, "Friend request not found");
    }

    const existingFriendship = await prisma.user.findFirst({
        where: {
            id: userId,
            friends: {
                some: {
                    id: otherUserId,
                },
            },
        },
    });

    if (existingFriendship) {
        throw new ServiceError(409, "The user is already on the friend list");
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: {
                friends: {
                    connect: {
                        id: otherUserId,
                    },
                },
            },
        });
        await tx.user.update({
            where: { id: otherUserId },
            data: {
                friends: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        await tx.friendRequest.delete({
            where: {
                sentUserId_receivedUserId: {
                    sentUserId: otherUserId,
                    receivedUserId: userId,
                },
            },
        });
    });
};
