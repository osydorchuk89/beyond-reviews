import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const setMissingMediaType = async (collection: string) => {
  const result = await prisma.$runCommandRaw({
    update: collection,
    updates: [
      {
        q: {
          mediaType: {
            $exists: false,
          },
        },
        u: {
          $set: {
            mediaType: "MOVIE",
          },
        },
        multi: true,
      },
    ],
  });

  const modifiedCount =
    typeof result === "object" &&
    result !== null &&
    "nModified" in result &&
    typeof result.nModified === "number"
      ? result.nModified
      : 0;

  console.log(`${collection}: ${modifiedCount.toLocaleString()} updated`);
};

async function main() {
  await setMissingMediaType("MovieReview");
  await setMissingMediaType("MovieWatchList");
  await setMissingMediaType("MovieRecommendationCache");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
