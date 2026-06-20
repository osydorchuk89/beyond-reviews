import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$runCommandRaw({
    update: "Movie",
    updates: [
      {
        q: {
          type: {
            $exists: false,
          },
        },
        u: {
          $set: {
            type: "MOVIE",
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

  console.log(`Updated ${modifiedCount.toLocaleString()} media items to MOVIE.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
