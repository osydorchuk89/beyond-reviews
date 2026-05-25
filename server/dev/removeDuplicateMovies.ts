import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 500;

type CliOptions = {
    apply: boolean;
};

type MovieCandidate = {
    id: string;
    title: string;
    releaseYear: number;
    popularity?: number;
    avgRating?: number;
    numRatings?: number;
    overview?: string;
    poster?: string;
};

type DuplicateGroup = {
    key: string;
    keep: MovieCandidate;
    remove: MovieCandidate[];
};

const parseArgs = (): CliOptions => ({
    apply: process.argv.includes("--apply"),
});

const normalizedTitle = (title: string) =>
    title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

const duplicateKeyFor = (movie: Pick<MovieCandidate, "title" | "releaseYear">) =>
    `${normalizedTitle(movie.title)}|${movie.releaseYear}`;

const movieScore = (movie: MovieCandidate) => {
    const hasPoster = movie.poster && !movie.poster.includes("fallback") ? 1 : 0;
    const hasOverview = movie.overview ? 1 : 0;

    return (
        (movie.numRatings ?? 0) * 1_000_000 +
        (movie.popularity ?? 0) * 1_000 +
        (movie.avgRating ?? 0) * 100 +
        hasPoster * 10 +
        hasOverview
    );
};

const findDuplicateGroups = (movies: MovieCandidate[]) => {
    const grouped = new Map<string, MovieCandidate[]>();

    for (const movie of movies) {
        const key = duplicateKeyFor(movie);
        grouped.set(key, [...(grouped.get(key) ?? []), movie]);
    }

    const duplicates: DuplicateGroup[] = [];

    for (const [key, group] of grouped) {
        if (group.length < 2) {
            continue;
        }

        const sorted = [...group].sort((a, b) => movieScore(b) - movieScore(a));
        duplicates.push({
            key,
            keep: sorted[0],
            remove: sorted.slice(1),
        });
    }

    return duplicates.sort((a, b) => b.remove.length - a.remove.length);
};

const flattenRemovedMovies = (groups: DuplicateGroup[]) =>
    groups.flatMap((group) => group.remove);

const chunk = <T>(items: T[], size = BATCH_SIZE) => {
    const chunks: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }

    return chunks;
};

const countRelatedRows = async (movieIdsToRemove: string[]) => {
    const duplicateReviews: { id: string }[] = [];

    for (const ids of chunk(movieIdsToRemove)) {
        duplicateReviews.push(
            ...(await prisma.movieReview.findMany({
                where: { movieId: { in: ids } },
                select: { id: true },
            })),
        );
        console.log(
            `Found duplicate movie reviews: ${duplicateReviews.length.toLocaleString()}`,
        );
    }

    const reviewIdsToRemove = duplicateReviews.map((review) => review.id);
    let reviewLikeCount = 0;
    let reviewActivityCount = 0;
    let movieActivityCount = 0;
    let watchListCount = 0;
    let reviewCount = 0;

    for (const ids of chunk(reviewIdsToRemove)) {
        const [likes, reviewActivities] = await Promise.all([
            prisma.movieReviewLike.count({
                where: { reviewId: { in: ids } },
            }),
            prisma.activity.count({
                where: { movieReviewId: { in: ids } },
            }),
        ]);

        reviewLikeCount += likes;
        reviewActivityCount += reviewActivities;
    }

    for (const ids of chunk(movieIdsToRemove)) {
        const [movieActivities, watchListEntries, reviews] = await Promise.all([
            prisma.activity.count({
                where: { movieId: { in: ids } },
            }),
            prisma.movieWatchList.count({
                where: { movieId: { in: ids } },
            }),
            prisma.movieReview.count({
                where: { movieId: { in: ids } },
            }),
        ]);

        movieActivityCount += movieActivities;
        watchListCount += watchListEntries;
        reviewCount += reviews;
    }

    return {
        reviewIdsToRemove,
        reviewLikeCount,
        reviewActivityCount,
        movieActivityCount,
        watchListCount,
        reviewCount,
    };
};

const deleteInChunks = async (
    label: string,
    ids: string[],
    deleteChunk: (ids: string[]) => Promise<{ count: number }>,
) => {
    let deleted = 0;

    for (const idsChunk of chunk(ids)) {
        const result = await deleteChunk(idsChunk);
        deleted += result.count;
        console.log(`${label}: ${deleted}/${ids.length} ids processed`);
    }

    return deleted;
};

async function main() {
    const options = parseArgs();
    const movies = await prisma.movie.findMany({
        select: {
            id: true,
            title: true,
            releaseYear: true,
        },
    });
    console.log(`Scanned movies: ${movies.length.toLocaleString()}`);

    const preliminaryGroups = findDuplicateGroups(movies);
    const candidateIds = [
        ...new Set(
            preliminaryGroups.flatMap((group) => [
                group.keep.id,
                ...group.remove.map((movie) => movie.id),
            ]),
        ),
    ];
    const detailedCandidates = new Map<string, MovieCandidate>();

    for (const ids of chunk(candidateIds)) {
        const details = await prisma.movie.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                title: true,
                releaseYear: true,
                popularity: true,
                avgRating: true,
                numRatings: true,
                overview: true,
                poster: true,
            },
        });

        for (const movie of details) {
            detailedCandidates.set(movie.id, movie);
        }
    }

    const duplicateGroups = findDuplicateGroups(
        candidateIds
            .map((id) => detailedCandidates.get(id))
            .filter((movie): movie is MovieCandidate => Boolean(movie)),
    );
    const moviesToRemove = flattenRemovedMovies(duplicateGroups);
    const movieIdsToRemove = moviesToRemove.map((movie) => movie.id);

    console.log(`Duplicate groups: ${duplicateGroups.length.toLocaleString()}`);
    console.log(`Duplicate movies to remove: ${moviesToRemove.length.toLocaleString()}`);

    for (const group of duplicateGroups.slice(0, 20)) {
        console.log(
            `- Keep "${group.keep.title}" (${group.keep.releaseYear}, ${group.keep.numRatings} reviews); remove ${group.remove.length}: ${group.remove
                .map((movie) => `${movie.title} [${movie.id}]`)
                .join(", ")}`,
        );
    }

    if (movieIdsToRemove.length === 0) {
        return;
    }

    const related = await countRelatedRows(movieIdsToRemove);

    console.log("Related entries to remove:");
    console.log(`- Movie reviews: ${related.reviewCount.toLocaleString()}`);
    console.log(`- Movie review likes: ${related.reviewLikeCount.toLocaleString()}`);
    console.log(
        `- Activities with duplicate movieId: ${related.movieActivityCount.toLocaleString()}`,
    );
    console.log(
        `- Activities with duplicate movieReviewId: ${related.reviewActivityCount.toLocaleString()}`,
    );
    console.log(`- Watchlist entries: ${related.watchListCount.toLocaleString()}`);

    if (!options.apply) {
        console.log("Dry run only. Re-run with --apply to delete these rows.");
        return;
    }

    console.log("Deleting duplicate movie related data...");

    await deleteInChunks(
        "Activities by movieReviewId",
        related.reviewIdsToRemove,
        (ids) =>
            prisma.activity.deleteMany({
                where: { movieReviewId: { in: ids } },
            }),
    );
    await deleteInChunks("Movie review likes", related.reviewIdsToRemove, (ids) =>
        prisma.movieReviewLike.deleteMany({
            where: { reviewId: { in: ids } },
        }),
    );
    await deleteInChunks("Activities by movieId", movieIdsToRemove, (ids) =>
        prisma.activity.deleteMany({
            where: { movieId: { in: ids } },
        }),
    );
    await deleteInChunks("Watchlist entries", movieIdsToRemove, (ids) =>
        prisma.movieWatchList.deleteMany({
            where: { movieId: { in: ids } },
        }),
    );
    await deleteInChunks("Movie reviews", related.reviewIdsToRemove, (ids) =>
        prisma.movieReview.deleteMany({
            where: { id: { in: ids } },
        }),
    );
    await deleteInChunks("Movies", movieIdsToRemove, (ids) =>
        prisma.movie.deleteMany({
            where: { id: { in: ids } },
        }),
    );

    console.log(`Done: removed ${movieIdsToRemove.length.toLocaleString()} duplicate movies.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
