import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 1_000;

type CliOptions = {
    dryRun: boolean;
    includeRated: boolean;
    includeLiked: boolean;
};

const parseArgs = (): CliOptions => {
    const options: CliOptions = {
        dryRun: false,
        includeRated: true,
        includeLiked: true,
    };

    for (const arg of process.argv.slice(2)) {
        if (arg === "--dry-run") {
            options.dryRun = true;
        }
        if (arg === "--rated-only") {
            options.includeRated = true;
            options.includeLiked = false;
        }
        if (arg === "--liked-only") {
            options.includeRated = false;
            options.includeLiked = true;
        }
    }

    return options;
};

const chunkedCreateMany = async <T>(
    label: string,
    data: T[],
    createMany: (chunk: T[]) => Promise<unknown>,
) => {
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const chunk = data.slice(i, i + BATCH_SIZE);
        await createMany(chunk);
        console.log(
            `${label}: ${Math.min(i + chunk.length, data.length)}/${data.length}`,
        );
    }
};

const ratedActivityKey = (userId: string, movieId: string) =>
    `${userId}:${movieId}`;

const likedActivityKey = (userId: string, movieReviewId: string) =>
    `${userId}:${movieReviewId}`;

async function main() {
    const options = parseArgs();

    const activitiesToCreate: {
        userId: string;
        action: string;
        reviewRating?: number;
        reviewText?: string | null;
        movieId?: string;
        movieReviewId?: string;
        date: Date;
    }[] = [];

    if (options.includeRated) {
        const [reviews, existingRatedActivities] = await Promise.all([
            prisma.movieReview.findMany({
                select: {
                    userId: true,
                    movieId: true,
                    date: true,
                    rating: true,
                    text: true,
                },
            }),
            prisma.activity.findMany({
                where: {
                    action: "rated",
                    movieId: { not: null },
                },
                select: {
                    userId: true,
                    movieId: true,
                },
            }),
        ]);

        const existingRatedKeys = new Set(
            existingRatedActivities
                .filter((activity) => activity.movieId)
                .map((activity) =>
                    ratedActivityKey(activity.userId, activity.movieId!),
                ),
        );

        for (const review of reviews) {
            const key = ratedActivityKey(review.userId, review.movieId);

            if (existingRatedKeys.has(key)) {
                continue;
            }

            activitiesToCreate.push({
                userId: review.userId,
                movieId: review.movieId,
                action: "rated",
                reviewRating: review.rating,
                reviewText: review.text,
                date: review.date,
            });
        }

        console.log(
            `Rated activities to create: ${activitiesToCreate.length.toLocaleString()}`,
        );
    }

    const ratedCount = activitiesToCreate.length;

    if (options.includeLiked) {
        const [likes, existingLikedActivities] = await Promise.all([
            prisma.movieReviewLike.findMany({
                select: {
                    userId: true,
                    reviewId: true,
                },
            }),
            prisma.activity.findMany({
                where: {
                    action: "liked",
                    movieReviewId: { not: null },
                },
                select: {
                    userId: true,
                    movieReviewId: true,
                },
            }),
        ]);

        const existingLikedKeys = new Set(
            existingLikedActivities
                .filter((activity) => activity.movieReviewId)
                .map((activity) =>
                    likedActivityKey(activity.userId, activity.movieReviewId!),
                ),
        );

        for (const like of likes) {
            const key = likedActivityKey(like.userId, like.reviewId);

            if (existingLikedKeys.has(key)) {
                continue;
            }

            activitiesToCreate.push({
                userId: like.userId,
                movieReviewId: like.reviewId,
                action: "liked",
                date: new Date(),
            });
        }

        console.log(
            `Liked activities to create: ${(activitiesToCreate.length - ratedCount).toLocaleString()}`,
        );
    }

    console.log(
        `Total activities to create: ${activitiesToCreate.length.toLocaleString()}`,
    );

    if (options.dryRun || activitiesToCreate.length === 0) {
        return;
    }

    await chunkedCreateMany("Activities", activitiesToCreate, (chunk) =>
        prisma.activity.createMany({ data: chunk }),
    );

    console.log(
        `Done: ${activitiesToCreate.length.toLocaleString()} activities created.`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
