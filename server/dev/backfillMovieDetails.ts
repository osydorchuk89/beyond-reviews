import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AggregateResult = {
  cursor?: {
    firstBatch?: unknown[];
  };
};

async function main() {
  const result = (await prisma.$runCommandRaw({
    aggregate: "Movie",
    pipeline: [
      {
        $match: {
          type: "MOVIE",
        },
      },
      {
        $project: {
          _id: "$_id",
          mediaItemId: "$_id",
          tmdbId: "$tmdbId",
          director: {
            $ifNull: ["$director", ""],
          },
          cast: {
            $ifNull: ["$cast", []],
          },
          runtime: {
            $ifNull: ["$runtime", 0],
          },
        },
      },
      {
        $merge: {
          into: "MovieDetails",
          on: "_id",
          whenMatched: "merge",
          whenNotMatched: "insert",
        },
      },
    ],
    cursor: {},
  })) as AggregateResult;

  const count = await prisma.movie.count();
  const batchCount = result.cursor?.firstBatch?.length ?? 0;

  console.log(`Movie detail rows available: ${count.toLocaleString()}`);
  console.log(`Aggregation returned ${batchCount.toLocaleString()} cursor rows.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
