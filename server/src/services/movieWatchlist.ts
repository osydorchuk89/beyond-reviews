import { PrismaClient } from "@prisma/client";

import { ServiceError } from "./errors";

interface UpdateMovieWatchlistArgs {
    movieId: string;
    userId: string;
    saved: boolean;
}

export const updateMovieWatchlist = async (
    prisma: PrismaClient,
    { movieId, userId, saved }: UpdateMovieWatchlistArgs,
) => {
    const movie = await prisma.mediaItem.findFirst({
        where: { id: movieId, type: "MOVIE" },
    });

    if (!movie) {
        throw new ServiceError(404, "Movie not found");
    }

    await prisma.$transaction(async (tx) => {
        if (saved) {
            await tx.savedItem.create({
                data: {
                    userId,
                    mediaItemId: movieId,
                    mediaType: "MOVIE",
                },
            });
        } else {
            await tx.savedItem.delete({
                where: {
                    mediaItemId_userId: {
                        mediaItemId: movieId,
                        userId,
                    },
                },
            });
        }

        await tx.activity.create({
            data: {
                userId,
                action: saved ? "saved" : "unsaved",
                mediaItemId: movieId,
                date: new Date(),
            },
        });
    });
};
