import { PrismaClient } from "@prisma/client";

import { ServiceError } from "./errors";

interface UpdateMovieWishlistArgs {
    movieId: string;
    userId: string;
    saved: boolean;
}

export const updateMovieWishlist = async (
    prisma: PrismaClient,
    { movieId, userId, saved }: UpdateMovieWishlistArgs,
) => {
    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
    });

    if (!movie) {
        throw new ServiceError(404, "Movie not found");
    }

    await prisma.$transaction(async (tx) => {
        if (saved) {
            const existingWishlistItem = await tx.wishlistItem.findFirst({
                where: {
                    userId,
                    movieId,
                    mediaType: "MOVIE",
                },
            });

            if (!existingWishlistItem) {
                await tx.wishlistItem.create({
                    data: {
                        userId,
                        movieId,
                        mediaType: "MOVIE",
                    },
                });
            }
        } else {
            await tx.wishlistItem.deleteMany({
                where: {
                    movieId,
                    userId,
                    mediaType: "MOVIE",
                },
            });
        }

        await tx.activity.create({
            data: {
                userId,
                action: saved ? "wishlisted" : "unwishlisted",
                movieId,
                date: new Date(),
            },
        });
    });
};
