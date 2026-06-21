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
    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
    });

    if (!movie) {
        throw new ServiceError(404, "Movie not found");
    }

    await prisma.$transaction(async (tx) => {
        if (saved) {
            await tx.savedItem.create({
                data: {
                    userId,
                    movieId,
                    mediaType: "MOVIE",
                },
            });
        } else {
            await tx.savedItem.delete({
                where: {
                    movieId_userId: {
                        movieId,
                        userId,
                    },
                },
            });
        }

        await tx.activity.create({
            data: {
                userId,
                action: saved ? "saved" : "unsaved",
                movieId,
                date: new Date(),
            },
        });
    });
};
