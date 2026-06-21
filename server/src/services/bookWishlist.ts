import { PrismaClient } from "@prisma/client";

import { ServiceError } from "./errors";

interface UpdateBookWishlistArgs {
    bookId: string;
    userId: string;
    saved: boolean;
}

export const updateBookWishlist = async (
    prisma: PrismaClient,
    { bookId, userId, saved }: UpdateBookWishlistArgs,
) => {
    const book = await prisma.book.findUnique({
        where: { id: bookId },
    });

    if (!book) {
        throw new ServiceError(404, "Book not found");
    }

    await prisma.$transaction(async (tx) => {
        if (saved) {
            const existingWishlistItem = await tx.wishlistItem.findFirst({
                where: {
                    bookId,
                    userId,
                    mediaType: "BOOK",
                },
            });

            if (!existingWishlistItem) {
                await tx.wishlistItem.create({
                    data: {
                        userId,
                        bookId,
                        mediaType: "BOOK",
                    },
                });
            }
        } else {
            await tx.wishlistItem.deleteMany({
                where: {
                    bookId,
                    userId,
                    mediaType: "BOOK",
                },
            });
        }

        await tx.activity.create({
            data: {
                userId,
                action: saved ? "wishlisted" : "unwishlisted",
                bookId,
                date: new Date(),
            },
        });
    });
};
