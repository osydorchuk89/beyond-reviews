import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BATCH_SIZE = 1_000;

type MongoUpdateOperation = {
  q: { _id: { $oid: string } };
  u: { $set: Record<string, unknown> };
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const runMovieReviewBulkUpdate = async (updates: MongoUpdateOperation[]) => {
  for (const batch of chunk(updates, BATCH_SIZE)) {
    await prisma.$runCommandRaw({
      update: "MovieReview",
      updates: batch,
      ordered: false,
    });
  }
};

const runBookBulkUpdate = async (updates: MongoUpdateOperation[]) => {
  for (const batch of chunk(updates, BATCH_SIZE)) {
    await prisma.$runCommandRaw({
      update: "Book",
      updates: batch,
      ordered: false,
    });
  }
};

const createManyInBatches = async <T>(
  label: string,
  data: T[],
  createMany: (chunk: T[]) => Promise<unknown>,
) => {
  for (let index = 0; index < data.length; index += BATCH_SIZE) {
    const batch = data.slice(index, index + BATCH_SIZE);
    await createMany(batch);
    console.log(`${label}: ${Math.min(index + batch.length, data.length)}/${data.length}`);
  }
};

async function main() {
  const bookReviews = await prisma.review.findMany({
    where: {
      mediaType: "BOOK",
      bookId: {
        not: null,
      },
    },
    select: {
      id: true,
      bookId: true,
      userId: true,
      rating: true,
      text: true,
    },
  });

  console.log(`Book reviews: ${bookReviews.length}`);

  const reviewIds = bookReviews.map((review) => review.id);
  const likeCounts = new Map<string, number>();

  for (const ids of chunk(reviewIds, BATCH_SIZE)) {
    const likes = await prisma.reviewLike.findMany({
      where: {
        reviewId: {
          in: ids,
        },
      },
      select: {
        reviewId: true,
      },
    });

    for (const like of likes) {
      likeCounts.set(like.reviewId, (likeCounts.get(like.reviewId) ?? 0) + 1);
    }
  }

  await prisma.review.updateMany({
    where: {
      mediaType: "BOOK",
    },
    data: {
      likeCount: 0,
    },
  });

  const likeCountUpdates: MongoUpdateOperation[] = [...likeCounts.entries()].map(
    ([reviewId, likeCount]) => ({
      q: { _id: { $oid: reviewId } },
      u: { $set: { likeCount } },
    }),
  );
  await runMovieReviewBulkUpdate(likeCountUpdates);
  console.log(`Updated like counts: ${likeCountUpdates.length}`);

  await prisma.activity.deleteMany({
    where: {
      bookId: {
        not: null,
      },
      action: "rated",
    },
  });
  for (const ids of chunk(reviewIds, BATCH_SIZE)) {
    await prisma.activity.deleteMany({
      where: {
        reviewId: {
          in: ids,
        },
      },
    });
  }

  const activities = bookReviews.map((review) => ({
    userId: review.userId,
    bookId: review.bookId!,
    reviewId: review.id,
    action: "rated",
    reviewRating: review.rating,
    reviewText: review.text,
    date: new Date(),
  }));

  await createManyInBatches("Book review activities", activities, (batch) =>
    prisma.activity.createMany({ data: batch }),
  );

  const aggregates = new Map<string, { sum: number; count: number }>();
  for (const review of bookReviews) {
    const aggregate = aggregates.get(review.bookId!) ?? { sum: 0, count: 0 };
    aggregate.sum += review.rating;
    aggregate.count += 1;
    aggregates.set(review.bookId!, aggregate);
  }

  await prisma.book.updateMany({
    data: {
      avgRating: 0,
      numRatings: 0,
    },
  });

  await runBookBulkUpdate(
    [...aggregates.entries()].map(([bookId, aggregate]) => ({
      q: { _id: { $oid: bookId } },
      u: {
        $set: {
          avgRating: aggregate.sum / aggregate.count,
          numRatings: aggregate.count,
        },
      },
    })),
  );

  console.log(`Updated book aggregates: ${aggregates.size}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
