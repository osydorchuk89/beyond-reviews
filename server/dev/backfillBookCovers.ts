import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

type GoogleBookVolume = {
  volumeInfo?: {
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
  };
};

type CliOptions = {
  write: boolean;
  quiet: boolean;
  limit?: number;
  delayMs: number;
  concurrency: number;
  googleOnly: boolean;
  openLibraryOnly: boolean;
};

type BookForCover = {
  id: string;
  title: string;
  image: string;
  isbn10: string | null;
  isbn13: string | null;
  googleBookId: string | null;
};

const parseArgs = (): CliOptions => {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
  const concurrencyArg = process.argv.find((arg) =>
    arg.startsWith("--concurrency="),
  );

  return {
    write: process.argv.includes("--write"),
    quiet: process.argv.includes("--quiet"),
    limit: limitArg ? Number(limitArg.replace("--limit=", "")) : undefined,
    delayMs: delayMsArg ? Number(delayMsArg.replace("--delay-ms=", "")) : 250,
    concurrency: concurrencyArg
      ? Math.max(1, Number(concurrencyArg.replace("--concurrency=", "")))
      : 6,
    googleOnly: process.argv.includes("--google-only"),
    openLibraryOnly: process.argv.includes("--open-library-only"),
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeGoogleCoverUrl = (image?: string | null) => {
  if (!image) return null;

  try {
    const url = new URL(image.replace(/^http:\/\//, "https://"));
    if (url.searchParams.has("zoom")) {
      url.searchParams.set("zoom", "0");
    }
    return url.toString();
  } catch {
    return image.replace(/^http:\/\//, "https://");
  }
};

const googleCoverFromVolume = (volume: GoogleBookVolume) => {
  const imageLinks = volume.volumeInfo?.imageLinks;
  const image =
    imageLinks?.extraLarge ??
    imageLinks?.large ??
    imageLinks?.medium ??
    imageLinks?.small ??
    imageLinks?.thumbnail ??
    imageLinks?.smallThumbnail;

  return normalizeGoogleCoverUrl(image);
};

const fetchGoogleCover = async (googleBookId: string) => {
  const url = new URL(`${GOOGLE_BOOKS_BASE_URL}/${googleBookId}`);
  url.searchParams.set("fields", "volumeInfo/imageLinks");

  if (GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BeyondReviewsBookCoverBackfill/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Books cover request failed for ${googleBookId}: ${response.status} ${response.statusText}`,
    );
  }

  return googleCoverFromVolume((await response.json()) as GoogleBookVolume);
};

const openLibraryCoverCandidates = (book: BookForCover) => {
  const candidates = [];

  if (book.isbn13) {
    candidates.push(
      `https://covers.openlibrary.org/b/isbn/${book.isbn13}-L.jpg?default=false`,
    );
  }
  if (book.isbn10) {
    candidates.push(
      `https://covers.openlibrary.org/b/isbn/${book.isbn10}-L.jpg?default=false`,
    );
  }

  return candidates;
};

const hasUsableImage = async (url: string) => {
  const response = await fetch(url, {
    method: "HEAD",
    headers: {
      "User-Agent": "BeyondReviewsBookCoverBackfill/1.0",
    },
  });

  return response.ok;
};

const findOpenLibraryCover = async (book: BookForCover) => {
  for (const url of openLibraryCoverCandidates(book)) {
    if (await hasUsableImage(url)) {
      return url;
    }
  }

  return null;
};

const findBestCover = async (book: BookForCover, options: CliOptions) => {
  if (!options.openLibraryOnly && book.googleBookId) {
    try {
      const googleCover = await fetchGoogleCover(book.googleBookId);
      if (googleCover) return { source: "google", url: googleCover };
    } catch (error) {
      if (!options.quiet) {
        console.warn(
          `Google cover lookup failed for ${book.title}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  if (!options.googleOnly) {
    try {
      const openLibraryCover = await findOpenLibraryCover(book);
      if (openLibraryCover) return { source: "openLibrary", url: openLibraryCover };
    } catch (error) {
      if (!options.quiet) {
        console.warn(
          `Open Library cover lookup failed for ${book.title}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  return null;
};

async function main() {
  const options = parseArgs();
  const books = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      image: true,
      isbn10: true,
      isbn13: true,
      googleBookId: true,
    },
    orderBy: {
      id: "asc",
    },
    take: Number.isFinite(options.limit) ? options.limit : undefined,
  });
  const stats = {
    checked: 0,
    changed: 0,
    unchanged: 0,
    noCandidate: 0,
    google: 0,
    openLibrary: 0,
  };
  const processBook = async (book: BookForCover) => {
    const cover = await findBestCover(book, options);
    stats.checked += 1;

    if (!cover) {
      stats.noCandidate += 1;
    } else if (cover.url === book.image) {
      stats.unchanged += 1;
    } else {
      stats.changed += 1;
      if (cover.source === "google") stats.google += 1;
      if (cover.source === "openLibrary") stats.openLibrary += 1;

      if (!options.quiet) {
        console.log(`${book.title}: ${book.image} -> ${cover.url}`);
      }

      if (options.write) {
        await prisma.book.update({
          where: { id: book.id },
          data: { image: cover.url },
        });
      }
    }

    if (options.quiet && stats.checked % 100 === 0) {
      console.log(JSON.stringify(stats));
    }
  };

  for (let index = 0; index < books.length; index += options.concurrency) {
    const batch = books.slice(index, index + options.concurrency);
    await Promise.all(batch.map((book) => processBook(book)));
    await sleep(options.delayMs);
  }

  console.log("");
  console.log(JSON.stringify({ ...stats, write: options.write }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
