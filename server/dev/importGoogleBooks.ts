import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
const MAX_RESULTS_PER_REQUEST = 40;

const DEFAULT_QUERIES = [
  "subject:fiction",
  "subject:adventure",
  "subject:fantasy",
  "subject:urban fantasy",
  "subject:science fiction",
  "subject:space opera",
  "subject:dystopian",
  "subject:mystery",
  "subject:crime",
  "subject:detective",
  "subject:thriller",
  "subject:suspense",
  "subject:horror",
  "subject:paranormal",
  "subject:romance",
  "subject:historical fiction",
  "subject:literature",
  "subject:classic",
  "subject:young adult fiction",
  "subject:children fiction",
  "subject:biography",
  "subject:memoir",
  "subject:history",
  "subject:science",
  "subject:technology",
  "subject:computer science",
  "subject:business",
  "subject:psychology",
  "subject:philosophy",
  "subject:self-help",
  "subject:politics",
  "subject:true crime",
  "subject:travel",
  "subject:health",
  "subject:education",
  "subject:art",
  "subject:music",
  "subject:religion",
  "subject:cooking",
  "subject:sports",
];

type GoogleBooksResponse = {
  totalItems?: number;
  items?: GoogleBookVolume[];
};

type GoogleBookVolume = {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: {
      type?: string;
      identifier?: string;
    }[];
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    language?: string;
    printType?: string;
  };
};

type ImportCandidate = {
  googleBookId: string;
  title: string;
  releaseYear: number;
  overview: string;
  language: string;
  genres: string[];
  keywords: string[];
  image: string;
  avgRating: number;
  numRatings: number;
  popularity: number;
  authors: string[];
  pageCount: number | null;
  isbn10: string | null;
  isbn13: string | null;
};

type CliOptions = {
  write: boolean;
  quiet: boolean;
  useApiKey: boolean;
  limitPerQuery: number;
  maxTotal: number;
  delayMs: number;
  maxAttempts: number;
  queries: string[];
};

const parseArgs = (): CliOptions => {
  const queryArgs = process.argv
    .filter((arg) => arg.startsWith("--query="))
    .map((arg) => arg.replace("--query=", "").trim())
    .filter(Boolean);
  const limitPerQueryArg = process.argv.find((arg) =>
    arg.startsWith("--limit-per-query="),
  );
  const maxTotalArg = process.argv.find((arg) => arg.startsWith("--max-total="));
  const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
  const maxAttemptsArg = process.argv.find((arg) =>
    arg.startsWith("--max-attempts="),
  );

  return {
    write: process.argv.includes("--write"),
    quiet: process.argv.includes("--quiet"),
    useApiKey: !process.argv.includes("--no-api-key"),
    limitPerQuery: limitPerQueryArg
      ? Number(limitPerQueryArg.replace("--limit-per-query=", ""))
      : 120,
    maxTotal: maxTotalArg ? Number(maxTotalArg.replace("--max-total=", "")) : 3000,
    delayMs: delayMsArg ? Number(delayMsArg.replace("--delay-ms=", "")) : 150,
    maxAttempts: maxAttemptsArg
      ? Number(maxAttemptsArg.replace("--max-attempts=", ""))
      : 4,
    queries: queryArgs.length > 0 ? queryArgs : DEFAULT_QUERIES,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const parseYear = (publishedDate?: string) => {
  const match = publishedDate?.match(/\d{4}/);
  if (!match) return null;

  const year = Number(match[0]);
  const nextYear = new Date().getFullYear() + 1;

  if (!Number.isInteger(year) || year < 1400 || year > nextYear) {
    return null;
  }

  return year;
};

const cleanIdentifier = (identifier?: string) =>
  identifier?.replace(/[^0-9Xx]/g, "").toUpperCase() ?? null;

const getIdentifiers = (volume: GoogleBookVolume) => {
  const identifiers = volume.volumeInfo?.industryIdentifiers ?? [];

  return {
    isbn10:
      identifiers
        .map((identifier) =>
          identifier.type === "ISBN_10"
            ? cleanIdentifier(identifier.identifier)
            : null,
        )
        .find((identifier): identifier is string => Boolean(identifier)) ??
      null,
    isbn13:
      identifiers
        .map((identifier) =>
          identifier.type === "ISBN_13"
            ? cleanIdentifier(identifier.identifier)
            : null,
        )
        .find((identifier): identifier is string => Boolean(identifier)) ??
      null,
  };
};

const getImage = (volume: GoogleBookVolume) => {
  const imageLinks = volume.volumeInfo?.imageLinks;
  const image =
    imageLinks?.extraLarge ??
    imageLinks?.large ??
    imageLinks?.medium ??
    imageLinks?.thumbnail ??
    imageLinks?.small ??
    imageLinks?.smallThumbnail;

  return image?.replace(/^http:\/\//, "https://") ?? null;
};

const candidateKey = (candidate: Pick<ImportCandidate, "title" | "authors" | "releaseYear">) =>
  `${normalizeText(candidate.title)}|${candidate.authors
    .map(normalizeText)
    .sort()
    .join(",")}|${candidate.releaseYear}`;

const candidateFromVolume = (
  volume: GoogleBookVolume,
  sourceQuery: string,
): ImportCandidate | null => {
  const volumeInfo = volume.volumeInfo;
  const googleBookId = volume.id;
  const title = volumeInfo?.title?.trim();
  const releaseYear = parseYear(volumeInfo?.publishedDate);
  const authors = volumeInfo?.authors?.map((author) => author.trim()).filter(Boolean);
  const overview = volumeInfo?.description
    ? stripHtml(volumeInfo.description)
    : null;
  const image = getImage(volume);
  const categories = volumeInfo?.categories
    ?.map((category) => category.trim())
    .filter(Boolean);

  if (
    !googleBookId ||
    !title ||
    !releaseYear ||
    !authors ||
    authors.length === 0 ||
    !overview ||
    !image ||
    !categories ||
    categories.length === 0
  ) {
    return null;
  }

  const { isbn10, isbn13 } = getIdentifiers(volume);
  const pageCount =
    typeof volumeInfo?.pageCount === "number" && volumeInfo.pageCount > 0
      ? volumeInfo.pageCount
      : null;

  if (pageCount !== null && pageCount < 50) {
    return null;
  }

  const numRatings =
    typeof volumeInfo?.ratingsCount === "number" && volumeInfo.ratingsCount > 0
      ? volumeInfo.ratingsCount
      : 0;
  const avgRating =
    typeof volumeInfo?.averageRating === "number" && volumeInfo.averageRating > 0
      ? Math.min(volumeInfo.averageRating * 2, 10)
      : 0;

  return {
    googleBookId,
    title,
    releaseYear,
    overview,
    language: volumeInfo?.language?.trim() || "en",
    genres: [...new Set(categories)].slice(0, 8),
    keywords: [...new Set([...categories, sourceQuery.replace(/^subject:/, "")])]
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 12),
    image,
    avgRating,
    numRatings,
    popularity: numRatings,
    authors,
    pageCount,
    isbn10,
    isbn13,
  };
};

const fetchVolumesOnce = async (
  query: string,
  startIndex: number,
  useApiKey: boolean,
) => {
  const url = new URL(GOOGLE_BOOKS_BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("startIndex", String(startIndex));
  url.searchParams.set("maxResults", String(MAX_RESULTS_PER_REQUEST));
  url.searchParams.set("printType", "books");
  url.searchParams.set("orderBy", "relevance");
  url.searchParams.set("langRestrict", "en");

  if (useApiKey && GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", GOOGLE_BOOKS_API_KEY);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BeyondReviewsBookImporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Google Books request failed for "${query}" at ${startIndex}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as GoogleBooksResponse;
};

const fetchVolumes = async (
  query: string,
  startIndex: number,
  maxAttempts: number,
  useApiKey: boolean,
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchVolumesOnce(query, startIndex, useApiKey);
    } catch (error) {
      if (attempt === maxAttempts) {
        console.warn(
          `Skipping Google Books request for "${query}" at ${startIndex} after ${maxAttempts} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return null;
      }

      const delayMs = attempt * attempt * 2500;
      console.warn(
        `Retrying Google Books request for "${query}" at ${startIndex} after ${delayMs}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(delayMs);
    }
  }

  throw new Error("Unreachable Google Books retry state");
};

const loadExistingBookKeys = async () => {
  const books = await prisma.book.findMany({
    select: {
      googleBookId: true,
      isbn10: true,
      isbn13: true,
      authors: true,
      title: true,
      releaseYear: true,
    },
  });

  return {
    googleBookIds: new Set(
      books
        .map((book) => book.googleBookId)
        .filter((id): id is string => Boolean(id)),
    ),
    isbn10s: new Set(
      books.map((book) => book.isbn10).filter((id): id is string => Boolean(id)),
    ),
    isbn13s: new Set(
      books.map((book) => book.isbn13).filter((id): id is string => Boolean(id)),
    ),
    titleAuthorYears: new Set(
      books.map((book) =>
        candidateKey({
          title: book.title,
          authors: book.authors,
          releaseYear: book.releaseYear,
        }),
      ),
    ),
  };
};

const isDuplicate = (
  candidate: ImportCandidate,
  keys: Awaited<ReturnType<typeof loadExistingBookKeys>>,
) =>
  keys.googleBookIds.has(candidate.googleBookId) ||
  (candidate.isbn13 !== null && keys.isbn13s.has(candidate.isbn13)) ||
  (candidate.isbn10 !== null && keys.isbn10s.has(candidate.isbn10)) ||
  keys.titleAuthorYears.has(candidateKey(candidate));

const addCandidateToKeys = (
  candidate: ImportCandidate,
  keys: Awaited<ReturnType<typeof loadExistingBookKeys>>,
) => {
  keys.googleBookIds.add(candidate.googleBookId);
  if (candidate.isbn13) keys.isbn13s.add(candidate.isbn13);
  if (candidate.isbn10) keys.isbn10s.add(candidate.isbn10);
  keys.titleAuthorYears.add(candidateKey(candidate));
};

const importCandidate = async (candidate: ImportCandidate) =>
  prisma.book.create({
    data: {
      title: candidate.title,
      releaseYear: candidate.releaseYear,
      overview: candidate.overview,
      language: candidate.language,
      genres: candidate.genres,
      keywords: candidate.keywords,
      popularity: candidate.popularity,
      avgRating: candidate.avgRating,
      numRatings: candidate.numRatings,
      image: candidate.image,
      authors: candidate.authors,
      pageCount: candidate.pageCount,
      isbn10: candidate.isbn10,
      isbn13: candidate.isbn13,
      googleBookId: candidate.googleBookId,
    },
  });

async function main() {
  const options = parseArgs();

  if (options.useApiKey && !GOOGLE_BOOKS_API_KEY) {
    throw new Error(
      "GOOGLE_BOOKS_API_KEY is required. Add it to server/.env before running the Google Books importer.",
    );
  }

  const existingKeys = await loadExistingBookKeys();
  const candidates: ImportCandidate[] = [];
  const stats = {
    fetched: 0,
    valid: 0,
    duplicates: 0,
    invalid: 0,
    imported: 0,
    failedPages: 0,
  };

  for (const query of options.queries) {
    const pages = Math.ceil(options.limitPerQuery / MAX_RESULTS_PER_REQUEST);

    for (let page = 0; page < pages; page += 1) {
      if (candidates.length >= options.maxTotal) break;

      const startIndex = page * MAX_RESULTS_PER_REQUEST;
      const data = await fetchVolumes(
        query,
        startIndex,
        Math.max(1, options.maxAttempts),
        options.useApiKey,
      );
      if (!data) {
        stats.failedPages += 1;
        await sleep(options.delayMs);
        continue;
      }
      const items = data.items ?? [];
      stats.fetched += items.length;

      for (const item of items) {
        const candidate = candidateFromVolume(item, query);

        if (!candidate) {
          stats.invalid += 1;
          continue;
        }

        if (isDuplicate(candidate, existingKeys)) {
          stats.duplicates += 1;
          continue;
        }

        stats.valid += 1;
        candidates.push(candidate);
        addCandidateToKeys(candidate, existingKeys);

        if (candidates.length >= options.maxTotal) break;
      }

      if (!options.quiet) {
        console.log(
          `${query}: page ${page + 1}/${pages}, candidates ${candidates.length}/${options.maxTotal}`,
        );
      }
      await sleep(options.delayMs);
    }
  }

  if (options.write) {
    for (let index = 0; index < candidates.length; index += 1) {
      await importCandidate(candidates[index]);
      stats.imported += 1;

      if (!options.quiet && stats.imported % 100 === 0) {
        console.log(`Imported ${stats.imported}/${candidates.length}`);
      }
    }
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
