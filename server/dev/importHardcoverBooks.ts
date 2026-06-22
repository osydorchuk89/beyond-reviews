import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HARDCOVER_API_URL =
  process.env.HARDCOVER_API_URL ?? "https://api.hardcover.app/v1/graphql";
const HARDCOVER_API_TOKEN = process.env.HARDCOVER_API_TOKEN;
const MAX_RESULTS_PER_REQUEST = 25;

const DEFAULT_QUERIES = [
  "",
  "fiction",
  "fantasy",
  "science fiction",
  "mystery",
  "thriller",
  "horror",
  "romance",
  "historical fiction",
  "literature",
  "classic",
  "young adult",
  "children",
  "biography",
  "memoir",
  "history",
  "science",
  "business",
  "psychology",
  "philosophy",
  "self help",
  "politics",
  "travel",
  "health",
  "art",
  "music",
];

type HardcoverSearchResponse = {
  data?: {
    search?: {
      ids?: Array<number | string>;
      results?:
        | HardcoverBookResult[]
        | {
            hits?: Array<{ document?: HardcoverBookResult }>;
          };
    };
  };
  errors?: Array<{ message?: string }>;
};

type HardcoverBookResult = Record<string, unknown>;

type ImportCandidate = {
  hardcoverBookId: number;
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
  googleBookId: null;
};

type CliOptions = {
  write: boolean;
  reset: boolean;
  quiet: boolean;
  limitPerQuery: number;
  maxTotal: number;
  delayMs: number;
  requestTimeoutMs: number;
  maxAttempts: number;
  queries: string[];
};

const parseArgs = (): CliOptions => {
  const queryArgs = process.argv
    .filter((arg) => arg.startsWith("--query="))
    .map((arg) => arg.replace("--query=", "").trim());
  const limitPerQueryArg = process.argv.find((arg) =>
    arg.startsWith("--limit-per-query="),
  );
  const maxTotalArg = process.argv.find((arg) => arg.startsWith("--max-total="));
  const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
  const requestTimeoutMsArg = process.argv.find((arg) =>
    arg.startsWith("--request-timeout-ms="),
  );
  const maxAttemptsArg = process.argv.find((arg) =>
    arg.startsWith("--max-attempts="),
  );

  return {
    write: process.argv.includes("--write"),
    reset: process.argv.includes("--reset"),
    quiet: process.argv.includes("--quiet"),
    limitPerQuery: limitPerQueryArg
      ? Number(limitPerQueryArg.replace("--limit-per-query=", ""))
      : 100,
    maxTotal: maxTotalArg ? Number(maxTotalArg.replace("--max-total=", "")) : 2500,
    delayMs: delayMsArg ? Number(delayMsArg.replace("--delay-ms=", "")) : 1100,
    requestTimeoutMs: requestTimeoutMsArg
      ? Number(requestTimeoutMsArg.replace("--request-timeout-ms=", ""))
      : 25000,
    maxAttempts: maxAttemptsArg
      ? Number(maxAttemptsArg.replace("--max-attempts=", ""))
      : 3,
    queries: queryArgs.length > 0 ? queryArgs : DEFAULT_QUERIES,
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const hardcoverAuthorizationHeader = () => {
  const token = HARDCOVER_API_TOKEN?.trim();
  if (!token) return null;

  return /^(bearer|basic)\s+/i.test(token) ? token : `Bearer ${token}`;
};

const SEARCH_BOOKS_QUERY = `
  query SearchBooks(
    $query: String!
    $page: Int!
    $perPage: Int!
    $sort: String
  ) {
    search(
      query: $query
      query_type: "Book"
      page: $page
      per_page: $perPage
      sort: $sort
    ) {
      ids
      results
    }
  }
`;

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

const stringValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : null;

const numberValue = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
};

const stringArrayValue = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : null))
        .filter((item): item is string => Boolean(item))
    : [];

const cleanIdentifier = (identifier?: string) =>
  identifier?.replace(/[^0-9Xx]/g, "").toUpperCase() ?? null;

const pickIdentifiers = (isbns: string[]) => {
  const cleaned = isbns.map(cleanIdentifier).filter(Boolean) as string[];

  return {
    isbn10: cleaned.find((isbn) => isbn.length === 10) ?? null,
    isbn13: cleaned.find((isbn) => isbn.length === 13) ?? null,
  };
};

const normalizeImageUrl = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    return value.map(normalizeImageUrl).find(Boolean) ?? null;
  }

  const imageObject = value as Record<string, unknown>;
  for (const key of ["url", "secure_url", "large", "medium", "small"]) {
    const image = stringValue(imageObject[key]);
    if (image) return image;
  }

  return null;
};

const parseReleaseYear = (result: HardcoverBookResult) => {
  const releaseYear = numberValue(result.release_year);
  if (releaseYear) return Math.trunc(releaseYear);

  const releaseDate = stringValue(result.release_date);
  const releaseDateMatch = releaseDate?.match(/\d{4}/);
  if (releaseDateMatch) return Number(releaseDateMatch[0]);

  const releaseDateInteger = numberValue(result.release_date_i);
  if (releaseDateInteger) {
    return Number(String(Math.trunc(releaseDateInteger)).slice(0, 4));
  }

  return null;
};

const candidateKey = (
  candidate: Pick<ImportCandidate, "title" | "authors" | "releaseYear">,
) =>
  `${normalizeText(candidate.title)}|${candidate.authors
    .map(normalizeText)
    .sort()
    .join(",")}|${candidate.releaseYear}`;

const hardcoverRatingToTenPointScale = (rating: number | null) => {
  if (!rating || rating <= 0) return 0;
  return rating <= 5 ? Math.min(rating * 2, 10) : Math.min(rating, 10);
};

const candidateFromResult = (
  result: HardcoverBookResult,
  sourceQuery: string,
): ImportCandidate | null => {
  const id = numberValue(result.id);
  const title = stringValue(result.title);
  const releaseYear = parseReleaseYear(result);
  const authors = stringArrayValue(result.author_names);
  const overview = stringValue(result.description);
  const image = normalizeImageUrl(result.image);
  const genres = stringArrayValue(result.genres).slice(0, 8);
  const tags = stringArrayValue(result.tags);
  const moods = stringArrayValue(result.moods);
  const isbns = stringArrayValue(result.isbns);

  if (
    !id ||
    !title ||
    !releaseYear ||
    releaseYear < 1400 ||
    releaseYear > new Date().getFullYear() + 1 ||
    authors.length === 0 ||
    !overview ||
    !image
  ) {
    return null;
  }

  const pageCount = numberValue(result.pages);
  if (pageCount !== null && pageCount < 50) return null;

  const ratingCount = numberValue(result.ratings_count);
  const usersCount = numberValue(result.users_count);
  const { isbn10, isbn13 } = pickIdentifiers(isbns);

  return {
    hardcoverBookId: Math.trunc(id),
    title,
    releaseYear,
    overview: stripHtml(overview),
    language: "en",
    genres,
    keywords: [
      ...new Set([
        ...genres,
        ...tags,
        ...moods,
        sourceQuery,
        `hardcover:${Math.trunc(id)}`,
      ]),
    ]
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 12),
    image,
    avgRating: hardcoverRatingToTenPointScale(numberValue(result.rating)),
    numRatings: ratingCount ? Math.trunc(ratingCount) : 0,
    popularity: usersCount ? Math.trunc(usersCount) : 0,
    authors,
    pageCount: pageCount ? Math.trunc(pageCount) : null,
    isbn10,
    isbn13,
    googleBookId: null,
  };
};

const resultsFromSearch = (
  results: HardcoverSearchResponse["data"] extends infer T
    ? T extends { search?: { results?: infer R } }
      ? R
      : never
    : never,
) => {
  if (Array.isArray(results)) return results;
  if (results && typeof results === "object" && Array.isArray(results.hits)) {
    return results.hits
      .map((hit) => hit.document)
      .filter((document): document is HardcoverBookResult => Boolean(document));
  }

  return [];
};

const fetchHardcoverOnce = async (
  query: string,
  page: number,
  requestTimeoutMs: number,
) => {
  const authorization = hardcoverAuthorizationHeader();
  if (!authorization) {
    throw new Error(
      "HARDCOVER_API_TOKEN is required. Add it to server/.env before running the Hardcover importer.",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  const response = await fetch(HARDCOVER_API_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
      "User-Agent": "BeyondReviewsHardcoverImporter/1.0",
    },
    body: JSON.stringify({
      query: SEARCH_BOOKS_QUERY,
      variables: {
        query,
        page,
        perPage: MAX_RESULTS_PER_REQUEST,
        sort: "users_count:desc",
      },
    }),
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(
      `Hardcover request failed for "${query}" page ${page}: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as HardcoverSearchResponse;
  if (data.errors?.length) {
    throw new Error(
      `Hardcover GraphQL error for "${query}" page ${page}: ${data.errors
        .map((error) => error.message)
        .join("; ")}`,
    );
  }

  return data;
};

const fetchHardcover = async (
  query: string,
  page: number,
  maxAttempts: number,
  requestTimeoutMs: number,
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetchHardcoverOnce(query, page, requestTimeoutMs);
    } catch (error) {
      if (attempt === maxAttempts) {
        console.warn(
          `Skipping Hardcover request for "${query}" page ${page} after ${maxAttempts} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return null;
      }

      const delayMs = attempt * 5000;
      console.warn(
        `Retrying Hardcover request for "${query}" page ${page} after ${delayMs}ms (${attempt}/${maxAttempts})`,
      );
      await sleep(delayMs);
    }
  }

  return null;
};

const loadExistingBookKeys = async () => {
  const books = await prisma.book.findMany({
    select: {
      hardcoverBookId: true,
      isbn10: true,
      isbn13: true,
      authors: true,
      title: true,
      releaseYear: true,
    },
  });

  return {
    hardcoverBookIds: new Set(
      books
        .map((book) => book.hardcoverBookId)
        .filter((id): id is number => typeof id === "number"),
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
  keys.hardcoverBookIds.has(candidate.hardcoverBookId) ||
  (candidate.isbn13 !== null && keys.isbn13s.has(candidate.isbn13)) ||
  (candidate.isbn10 !== null && keys.isbn10s.has(candidate.isbn10)) ||
  keys.titleAuthorYears.has(candidateKey(candidate));

const addCandidateToKeys = (
  candidate: ImportCandidate,
  keys: Awaited<ReturnType<typeof loadExistingBookKeys>>,
) => {
  keys.hardcoverBookIds.add(candidate.hardcoverBookId);
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
      hardcoverBookId: candidate.hardcoverBookId,
    },
  });

async function main() {
  const options = parseArgs();

  if (!HARDCOVER_API_TOKEN) {
    throw new Error(
      "HARDCOVER_API_TOKEN is required. Add it to server/.env before running the Hardcover importer.",
    );
  }

  if (options.reset && !options.write) {
    throw new Error("--reset can only be used together with --write");
  }

  if (options.reset) {
    const result = await prisma.book.deleteMany({});
    console.log(`Deleted ${result.count} existing Book records`);
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

    for (let page = 1; page <= pages; page += 1) {
      if (candidates.length >= options.maxTotal) break;

      const data = await fetchHardcover(
        query,
        page,
        Math.max(1, options.maxAttempts),
        Math.max(1000, options.requestTimeoutMs),
      );

      if (!data) {
        stats.failedPages += 1;
        await sleep(options.delayMs);
        continue;
      }

      const results = resultsFromSearch(data.data?.search?.results);
      stats.fetched += results.length;

      for (const result of results) {
        const candidate = candidateFromResult(result, query);

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
          `${query || "(default)"}: page ${page}/${pages}, candidates ${candidates.length}/${options.maxTotal}`,
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
