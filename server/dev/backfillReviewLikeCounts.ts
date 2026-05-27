import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CliOptions = {
    dryRun: boolean;
};

const parseArgs = (): CliOptions => ({
    dryRun: process.argv.includes("--dry-run"),
});

async function main() {
    const { dryRun } = parseArgs();

    const [reviews, likeCounts] = await Promise.all([
        prisma.movieReview.findMany({
            select: {
                id: true,
                likeCount: true,
            },
        }),
        prisma.movieReviewLike.groupBy({
            by: ["reviewId"],
            _count: {
                reviewId: true,
            },
        }),
    ]);

    const likeCountByReviewId = new Map(
        likeCounts.map((item) => [item.reviewId, item._count.reviewId]),
    );

    const updates = reviews
        .map((review) => ({
            id: review.id,
            current: review.likeCount,
            next: likeCountByReviewId.get(review.id) ?? 0,
        }))
        .filter((review) => review.current !== review.next);

    console.log(`Reviews checked: ${reviews.length.toLocaleString()}`);
    console.log(`Reviews to update: ${updates.length.toLocaleString()}`);

    if (dryRun || updates.length === 0) {
        return;
    }

    for (const [index, review] of updates.entries()) {
        await prisma.movieReview.update({
            where: { id: review.id },
            data: {
                likeCount: review.next,
            },
        });

        if ((index + 1) % 1_000 === 0) {
            console.log(
                `Updated ${index + 1}/${updates.length.toLocaleString()}`,
            );
        }
    }

    console.log(`Done: ${updates.length.toLocaleString()} reviews updated.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
