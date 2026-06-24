import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HARDCOVER_API_URL =
  process.env.HARDCOVER_API_URL ?? "https://api.hardcover.app/v1/graphql";
const HARDCOVER_API_TOKEN = process.env.HARDCOVER_API_TOKEN;
const BATCH_SIZE = 50;

type HardcoverBook = {
  id: number;
  title: string;
  contributions?: Array<{
    contribution?: string | null;
    author?: {
      name?: string | null;
    } | null;
  }> | null;
};

type HardcoverBooksResponse = {
  data?: {
    books?: HardcoverBook[];
  };
  errors?: Array<{ message?: string }>;
};

const BOOKS_QUERY = `
  query Books($ids: [Int!]) {
    books(where: { id: { _in: $ids } }) {
      id
      title
      contributions {
        contribution
        author {
          name
        }
      }
    }
  }
`;

const authorizationHeader = () => {
  const token = HARDCOVER_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "HARDCOVER_API_TOKEN is required. Add it to server/.env before running the backfill.",
    );
  }

  return /^(bearer|basic)\s+/i.test(token) ? token : `Bearer ${token}`;
};

const uniqueStrings = (values: string[]) => [...new Set(values)];

const primaryAuthorsFromBook = (book: HardcoverBook) => {
  const contributions = book.contributions ?? [];

  const namesForRole = (isMatchingRole: (role: string | null) => boolean) =>
    uniqueStrings(
      contributions
        .map((contribution) => {
          const role = contribution.contribution?.trim() ?? null;
          const name = contribution.author?.name?.trim();

          return name && isMatchingRole(role) ? name : null;
        })
        .filter((name): name is string => Boolean(name)),
    );

  const directAuthors = namesForRole(
    (role) => role === null || /^author$/i.test(role) || /^writer$/i.test(role),
  );
  if (directAuthors.length > 0) return directAuthors;

  return namesForRole((role) => /^source material$/i.test(role ?? ""));
};

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const fetchHardcoverBooks = async (ids: number[]) => {
  const response = await fetch(HARDCOVER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorizationHeader(),
      "User-Agent": "BeyondReviewsHardcoverAuthorBackfill/1.0",
    },
    body: JSON.stringify({
      query: BOOKS_QUERY,
      variables: { ids },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Hardcover request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as HardcoverBooksResponse;
  if (data.errors?.length) {
    throw new Error(
      `Hardcover GraphQL error: ${data.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  return data.data?.books ?? [];
};

async function main() {
  const write = process.argv.includes("--write");

  const books = await prisma.book.findMany({
    where: {
      hardcoverBookId: { not: null },
    },
    select: {
      id: true,
      title: true,
      authors: true,
      hardcoverBookId: true,
    },
    orderBy: {
      title: "asc",
    },
  });

  const stats = {
    checked: 0,
    changed: 0,
    unchanged: 0,
    skipped: 0,
    written: 0,
  };

  for (let index = 0; index < books.length; index += BATCH_SIZE) {
    const batch = books.slice(index, index + BATCH_SIZE);
    const ids = batch
      .map((book) => book.hardcoverBookId)
      .filter((id): id is number => typeof id === "number");
    const hardcoverBooks = await fetchHardcoverBooks(ids);
    const hardcoverBooksById = new Map(
      hardcoverBooks.map((book) => [book.id, book]),
    );

    for (const book of batch) {
      stats.checked += 1;
      const hardcoverBook = book.hardcoverBookId
        ? hardcoverBooksById.get(book.hardcoverBookId)
        : null;
      const primaryAuthors = hardcoverBook
        ? primaryAuthorsFromBook(hardcoverBook)
        : [];

      if (primaryAuthors.length === 0) {
        stats.skipped += 1;
        continue;
      }

      if (arraysEqual(book.authors, primaryAuthors)) {
        stats.unchanged += 1;
        continue;
      }

      stats.changed += 1;
      console.log(
        `${book.title}: ${book.authors.join(", ")} -> ${primaryAuthors.join(", ")}`,
      );

      if (write) {
        await prisma.book.update({
          where: { id: book.id },
          data: { authors: primaryAuthors },
        });
        stats.written += 1;
      }
    }

    console.log(`Processed ${Math.min(index + BATCH_SIZE, books.length)}/${books.length}`);
  }

  console.log("");
  console.log(JSON.stringify({ ...stats, write }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
