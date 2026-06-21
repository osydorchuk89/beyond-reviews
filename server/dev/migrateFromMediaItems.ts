import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MongoId = { $oid: string };
type MongoDocument = Record<string, unknown> & { _id: MongoId };

const BATCH_SIZE = 500;

const oid = (id: MongoId | string) =>
  typeof id === "string" ? { $oid: id } : id;

const findBatch = async <T extends MongoDocument>(
  collection: string,
  filter: Record<string, unknown>,
  skip: number,
) => {
  const result = (await prisma.$runCommandRaw({
    find: collection,
    filter,
    skip,
    limit: BATCH_SIZE,
  })) as {
    cursor?: {
      firstBatch?: T[];
    };
  };

  return result.cursor?.firstBatch ?? [];
};

const countCollection = async (
  collection: string,
  filter: Record<string, unknown> = {},
) => {
  const result = (await prisma.$runCommandRaw({
    count: collection,
    query: filter,
  })) as { n?: number };

  return result.n ?? 0;
};

const updateOne = async (
  collection: string,
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
) =>
  prisma.$runCommandRaw({
    update: collection,
    updates: [{ q: filter, u: update }],
  });

const deleteBookMediaItems = async () => {
  let deleted = 0;

  while (true) {
    const books = await findBatch<MongoDocument>(
      "Movie",
      { type: "BOOK" },
      0,
    );
    if (books.length === 0) break;

    const result = (await prisma.$runCommandRaw({
      delete: "Movie",
      deletes: [
        {
          q: {
            _id: {
              $in: books.map((book) => book._id),
            },
          },
          limit: 0,
        },
      ],
    })) as { n?: number };

    deleted += result.n ?? 0;
  }

  return { deleted };
};

const insertBook = async (
  base: MongoDocument,
  details: MongoDocument | null,
) => {
  const existingCount = await countCollection("Book", { _id: base._id });
  if (existingCount > 0) return false;

  await prisma.$runCommandRaw({
    insert: "Book",
    documents: [
      {
        _id: base._id,
        title: base.title,
        releaseYear: base.releaseYear,
        overview: base.overview,
        language: base.language,
        genres: base.genres,
        keywords: base.keywords ?? [],
        popularity: base.popularity ?? 0,
        avgRating: base.avgRating ?? 0,
        numRatings: base.numRatings ?? 0,
        poster: base.poster,
        authors: details?.authors ?? [],
        pageCount: details?.pageCount ?? null,
        isbn10: details?.isbn10 ?? null,
        isbn13: details?.isbn13 ?? null,
        googleBookId: details?.googleBookId ?? null,
      },
    ],
  });

  return true;
};

const migrateBooks = async () => {
  let inserted = 0;
  let missingDetails = 0;
  let skip = 0;

  while (true) {
    const books = await findBatch<MongoDocument>(
      "Movie",
      { type: "BOOK" },
      skip,
    );
    if (books.length === 0) break;

    for (const base of books) {
      const details = await findBatch<MongoDocument>(
        "BookDetails",
        { mediaItemId: oid(base._id) },
        0,
      );
      if (details.length === 0) missingDetails += 1;
      if (await insertBook(base, details[0] ?? null)) inserted += 1;
    }

    skip += books.length;
  }

  return { inserted, missingDetails };
};

const migrateMovieDetails = async () => {
  let updated = 0;
  let missingBaseMovies = 0;
  let skip = 0;

  while (true) {
    const detailsBatch = await findBatch<MongoDocument>("MovieDetails", {}, skip);
    if (detailsBatch.length === 0) break;

    for (const details of detailsBatch) {
      const mediaItemId = details.mediaItemId as MongoId | undefined;
      if (!mediaItemId) continue;

      const baseCount = await countCollection("Movie", {
        _id: oid(mediaItemId),
        type: "MOVIE",
      });
      if (baseCount === 0) {
        missingBaseMovies += 1;
        continue;
      }

      await updateOne(
        "Movie",
        { _id: oid(mediaItemId) },
        {
          $set: {
            tmdbId: details.tmdbId ?? null,
            director: details.director ?? "",
            cast: details.cast ?? [],
            runtime: details.runtime ?? 0,
          },
          $unset: {
            type: "",
          },
        },
      );
      updated += 1;
    }

    skip += detailsBatch.length;
  }

  return { updated, missingBaseMovies };
};

async function main() {
  const before = {
    movieCollection: await countCollection("Movie"),
    bookMediaItems: await countCollection("Movie", { type: "BOOK" }),
    movieMediaItems: await countCollection("Movie", { type: "MOVIE" }),
    bookCollection: await countCollection("Book"),
    movieDetails: await countCollection("MovieDetails"),
    bookDetails: await countCollection("BookDetails"),
  };

  const books = await migrateBooks();
  const movies = await migrateMovieDetails();
  const deleteResult = await deleteBookMediaItems();

  const after = {
    movieCollection: await countCollection("Movie"),
    bookMediaItems: await countCollection("Movie", { type: "BOOK" }),
    movieCollectionWithDirector: await countCollection("Movie", {
      director: { $exists: true },
    }),
    bookCollection: await countCollection("Book"),
  };

  console.log(
    JSON.stringify(
      {
        before,
        books,
        movies,
        deleteBookMediaItems: deleteResult,
        after,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
