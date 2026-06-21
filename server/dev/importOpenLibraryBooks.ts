import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";
const MAX_RESULTS_PER_REQUEST = 100;

const DEFAULT_QUERIES = [
  "subject:fiction",
  "subject:fantasy",
  "subject:science fiction",
  "subject:mystery",
  "subject:thriller",
  "subject:horror",
  "subject:romance",
  "subject:historical fiction",
  "subject:literature",
  "subject:classic",
  "subject:young adult fiction",
  "subject:children fiction",
  "subject:biography",
  "subject:history",
  "subject:science",
  "subject:business",
  "subject:psychology",
  "subject:philosophy",
  "subject:self-help",
  "subject:politics",
  "subject:travel",
  "subject:health",
  "subject:education",
  "subject:art",
  "subject:music",
];

type OpenLibraryResponse = {
  docs?: OpenLibraryDoc[];
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
  number_of_pages_median?: number;
  first_sentence?: string[];
  language?: string[];
};

type ImportCandidate = {
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
    limitPerQuery: limitPerQueryArg
      ? Number(limitPerQueryArg.replace("--limit-per-query=", ""))
      : 300,
    maxTotal: maxTotalArg ? Number(maxTotalArg.replace("--max-total=", "")) : 2500,
    delayMs: delayMsArg ? Number(delayMsArg.replace("--delay-ms=", "")) : 250,
    maxAttempts: maxAttemptsArg
      ? Number(maxAttemptsArg.replace("--max-attempts=", ""))
      : 3,
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

const cleanIdentifier = (identifier?: string) =>
  identifier?.replace(/[^0-9Xx]/g, "").toUpperCase() ?? null;

const candidateKey = (
  candidate: Pick<ImportCandidate, "title" | "authors" | "releaseYear">,
) =>
  `${normalizeText(candidate.title)}|${candidate.authors
    .map(normalizeText)
    .sort()
    .join(",")}|${candidate.releaseYear}`;

const pickIdentifiers = (isbns?: string[]) => {
  const cleaned = (isbns ?? []).map(cleanIdentifier).filter(Boolean) as string[];

  return {
    isbn10: cleaned.find((isbn) => isbn.length === 10) ?? null,
    isbn13: cleaned.find((isbn) => isbn.length === 13) ?? null,
  };
};

const openLibraryCoverUrl = ({
  coverId,
  isbn13,
  isbn10,
}: {
  coverId: number;
  isbn13: string | null;
  isbn10: string | null;
}) => {
  const isbn = isbn13 ?? isbn10;

  return isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`
    : `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`;
};

const cleanSubjects = (subjects?: string[]) =>
  [
    ...new Set(
      (subjects ?? [])
        .map((subject) => subject.trim())
        .filter((subject) => subject.length > 1 && subject.length <= 60),
    ),
  ];

const overviewFromDoc = (
  doc: OpenLibraryDoc,
  authors: string[],
  genres: string[],
) => {
  const firstSentence = doc.first_sentence
    ?.map((sentence) => sentence.trim())
    .find(Boolean);

  if (firstSentence) return firstSentence;

  return `A book by ${authors.join(", ")} categorized as ${genres
    .slice(0, 4)
    .join(", ")}.`;
};

const candidateFromDoc = (
  doc: OpenLibraryDoc,
  sourceQuery: string,
): ImportCandidate | null => {
  const title = doc.title?.trim();
  const releaseYear = doc.first_publish_year;
  const authors = doc.author_name?.map((author) => author.trim()).filter(Boolean);
  const subjects = cleanSubjects(doc.subject);

  if (
    !doc.key ||
    !title ||
    !Number.isInteger(releaseYear) ||
    releaseYear < 1400 ||
    releaseYear > new Date().getFullYear() + 1 ||
    !authors ||
    authors.length === 0 ||
    !doc.cover_i ||
    subjects.length === 0
  ) {
    return null;
  }

  const pageCount =
    typeof doc.number_of_pages_median === "number" && doc.number_of_pages_median > 0
      ? Math.round(doc.number_of_pages_median)
      : null;

  if (pageCount !== null && pageCount < 50) {
    return null;
  }

  const genres = subjects.slice(0, 8);
  const { isbn10, isbn13 } = pickIdentifiers(doc.isbn);
  const numRatings =
    typeof doc.ratings_count === "number" && doc.ratings_count > 0
      ? Math.round(doc.ratings_count)
      : 0;
  const avgRating =
    typeof doc.ratings_average === "number" && doc.ratings_average > 0
      ? Math.min(doc.ratings_average * 2, 10)
      : 0;

  return {
    title,
    releaseYear,
    overview: overviewFromDoc(doc, authors, genres),
    language: doc.language?.includes("eng") ? "en" : "en",
    genres,
    keywords: [
      ...new Set([
        ...subjects,
        sourceQuery.replace(/^subject:/, ""),
        `openlibrary:${doc.key}`,
      ]),
    ]
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 12),
    image: openLibraryCoverUrl({
      coverId: doc.cover_i,
      isbn13,
      isbn10,
    }),
    avgRating,
    numRatings,
    popularity: numRatings,
    authors,
    pageCount,
    isbn10,
    isbn13,
  };
};

const fetchBooksOnce = async (query: string, offset: number) => {
  const url = new URL(OPEN_LIBRARY_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("language", "eng");
  url.searchParams.set("limit", String(MAX_RESULTS_PER_REQUEST));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set(
    "fields",
    [
      "key",
      "title",
      "author_name",
      "first_publish_year",
      "isbn",
      "cover_i",
      "subject",
      "ratings_average",
      "ratings_count",
      "number_of_pages_median",
      "first_sentence",
      "language",
    ].join(","),
  );

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BeyondReviewsBookImporter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Open Library request failed for "${query}" at ${offset}: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as OpenLibraryResponse;
};

const fetchBooks = async (
  query: string,
  offset: number,
  maxAttempts: number,
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchBooksOnce(query, offset);
    } catch (error) {
      if (attempt === maxAttempts) {
        console.warn(
          `Skipping Open Library request for "${query}" at ${offset} after ${maxAttempts} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return null;
      }

      const delayMs = attempt * 1500;
      console.warn(
        `Retrying Open Library request for "${query}" at ${offset} after ${delayMs}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(delayMs);
    }
  }

  return null;
};

const loadExistingBookKeys = async () => {
  const books = await prisma.book.findMany({
    select: {
      isbn10: true,
      isbn13: true,
      authors: true,
      title: true,
      releaseYear: true,
    },
  });

  return {
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
  (candidate.isbn13 !== null && keys.isbn13s.has(candidate.isbn13)) ||
  (candidate.isbn10 !== null && keys.isbn10s.has(candidate.isbn10)) ||
  keys.titleAuthorYears.has(candidateKey(candidate));

const addCandidateToKeys = (
  candidate: ImportCandidate,
  keys: Awaited<ReturnType<typeof loadExistingBookKeys>>,
) => {
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
      googleBookId: null,
    },
  });

async function main() {
  const options = parseArgs();
  const existingKeys = await loadExistingBookKeys();
  const candidates: ImportCandidate[] = [];
  const stats = {
    fetched: 0,
    valid: 0,
    duplicates: 0,
    invalid: 0,
    imported: 0,
    failedPages: 0,
    generatedOverviews: 0,
  };

  for (const query of options.queries) {
    const pages = Math.ceil(options.limitPerQuery / MAX_RESULTS_PER_REQUEST);

    for (let page = 0; page < pages; page += 1) {
      if (candidates.length >= options.maxTotal) break;

      const offset = page * MAX_RESULTS_PER_REQUEST;
      const data = await fetchBooks(
        query,
        offset,
        Math.max(1, options.maxAttempts),
      );
      if (!data) {
        stats.failedPages += 1;
        await sleep(options.delayMs);
        continue;
      }

      const docs = data.docs ?? [];
      stats.fetched += docs.length;

      for (const doc of docs) {
        const candidate = candidateFromDoc(doc, query);

        if (!candidate) {
          stats.invalid += 1;
          continue;
        }

        if (isDuplicate(candidate, existingKeys)) {
          stats.duplicates += 1;
          continue;
        }

        if (!doc.first_sentence?.some((sentence) => sentence.trim())) {
          stats.generatedOverviews += 1;
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

    if (candidates.length >= options.maxTotal) break;
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
