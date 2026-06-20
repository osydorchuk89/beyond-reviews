import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

type LocalMovie = {
  id: string;
  detailId: string;
  title: string;
  releaseYear: number;
  director: string | null;
  tmdbId: number | null;
};

type TmdbMovieResult = {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  popularity?: number;
};

type TmdbSearchResponse = {
  results?: TmdbMovieResult[];
};

type TmdbMovieDetails = TmdbMovieResult;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const releaseYearFromDate = (releaseDate?: string) => {
  if (!releaseDate || releaseDate.length < 4) {
    return null;
  }

  const year = Number(releaseDate.slice(0, 4));
  return Number.isFinite(year) ? year : null;
};

const tmdbFetch = async <T>(path: string, params: Record<string, string>) => {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (TMDB_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_TOKEN}`;
  } else if (TMDB_API_KEY) {
    url.searchParams.set("api_key", TMDB_API_KEY);
  } else {
    throw new Error("TMDB_READ_ACCESS_TOKEN or TMDB_API_KEY is required.");
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
};

const findBestTmdbMatch = async (movie: LocalMovie) => {
  const search = await tmdbFetch<TmdbSearchResponse>("/search/movie", {
    query: movie.title,
    year: String(movie.releaseYear),
    include_adult: "false",
    language: "en-US",
  });

  const normalizedTitle = normalize(movie.title);
  const matches = (search.results ?? [])
    .map((result) => {
      const resultYear = releaseYearFromDate(result.release_date);
      const titleMatches = Boolean(
        result.title && normalize(result.title) === normalizedTitle,
      );
      const yearMatches = resultYear === movie.releaseYear;

      return {
        result,
        resultYear,
        titleMatches,
        yearMatches,
        score:
          (titleMatches ? 4 : 0) +
          (yearMatches ? 3 : 0) +
          ((result.popularity ?? 0) / 1000),
      };
    })
    .sort((left, right) => right.score - left.score);

  const best = matches[0];

  if (!best || !best.titleMatches || !best.yearMatches) {
    return null;
  }

  return best;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const shouldWrite = process.argv.includes("--write");
  const countOnly = process.argv.includes("--count-only");
  const auditExisting = process.argv.includes("--audit-existing");
  const quiet = process.argv.includes("--quiet");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
  const limit = limitArg ? Number(limitArg.replace("--limit=", "")) : undefined;
  const concurrency = Math.max(
    1,
    Number.isFinite(Number(concurrencyArg?.replace("--concurrency=", "")))
      ? Number(concurrencyArg?.replace("--concurrency=", ""))
      : 5,
  );
  const needsBackfillWhere = {
    OR: [{ tmdbId: null }, { tmdbId: { isSet: false } }],
  };

  if (countOnly) {
    const count = await prisma.movie.count({
      where: needsBackfillWhere,
    });
    console.log(count);
    return;
  }

  if (auditExisting) {
    const movies = await prisma.movie.findMany({
      where: {
        tmdbId: { isSet: true },
      },
      select: {
        id: true,
        director: true,
        tmdbId: true,
        mediaItem: {
          select: {
            id: true,
            title: true,
            releaseYear: true,
          },
        },
      },
      orderBy: {
        title: "asc",
      },
      take: Number.isFinite(limit) ? limit : undefined,
    });

    let valid = 0;
    let invalid = 0;
    let cleared = 0;

    for (const movie of movies) {
      if (!movie.tmdbId) {
        continue;
      }

      const details = await tmdbFetch<TmdbMovieDetails>(`/movie/${movie.tmdbId}`, {
        language: "en-US",
      });
      const titleMatches = Boolean(
        details.title && normalize(details.title) === normalize(movie.mediaItem.title),
      );
      const yearMatches =
        releaseYearFromDate(details.release_date) === movie.mediaItem.releaseYear;

      if (titleMatches && yearMatches) {
        valid += 1;
      } else {
        invalid += 1;
        if (!quiet) {
          console.log(
            `INVALID ${movie.mediaItem.title} (${movie.mediaItem.releaseYear}) -> ${details.title ?? "Untitled"} (${releaseYearFromDate(details.release_date)}) [${movie.tmdbId}]`,
          );
        }

        if (shouldWrite) {
          await prisma.movie.update({
            where: { id: movie.id },
            data: { tmdbId: null },
          });
          cleared += 1;
        }
      }

      await sleep(100);
    }

    console.log("");
    console.log(`Audited: ${movies.length}`);
    console.log(`Valid: ${valid}`);
    console.log(`Invalid: ${invalid}`);
    console.log(`Cleared: ${cleared}`);
    console.log(shouldWrite ? "Mode: write" : "Mode: dry-run");
    return;
  }

  const movies = (
    await prisma.movie.findMany({
    where: needsBackfillWhere,
    select: {
      id: true,
      director: true,
      tmdbId: true,
      mediaItem: {
        select: {
          id: true,
          title: true,
          releaseYear: true,
        },
      },
    },
    orderBy: {
      mediaItemId: "asc",
    },
    take: Number.isFinite(limit) ? limit : undefined,
  })
  ).map((movie) => ({
    id: movie.mediaItem.id,
    detailId: movie.id,
    title: movie.mediaItem.title,
    releaseYear: movie.mediaItem.releaseYear,
    director: movie.director,
    tmdbId: movie.tmdbId,
  }));

  let matched = 0;
  let updated = 0;
  let unmatched = 0;
  let checked = 0;

  const processMovie = async (movie: LocalMovie) => {
    const match = await findBestTmdbMatch(movie);

    if (!match) {
      unmatched += 1;
      checked += 1;
      if (!quiet) {
        console.log(`MISS  ${movie.title} (${movie.releaseYear})`);
      }
      if (quiet && checked % 250 === 0) {
        console.log(
          `Progress: ${checked}/${movies.length} checked, ${matched} matched, ${unmatched} unmatched, ${updated} updated`,
        );
      }
      return;
    }

    matched += 1;
    const tmdbTitle = match.result.title ?? match.result.original_title ?? "Untitled";
    if (!quiet) {
      console.log(
        `MATCH ${movie.title} (${movie.releaseYear}) -> ${tmdbTitle} (${match.resultYear}) [${match.result.id}]`,
      );
    }

    if (shouldWrite) {
      await prisma.movie.update({
        where: { id: movie.detailId },
        data: { tmdbId: match.result.id },
      });
      updated += 1;
    }

    checked += 1;
    if (quiet && checked % 250 === 0) {
      console.log(
        `Progress: ${checked}/${movies.length} checked, ${matched} matched, ${unmatched} unmatched, ${updated} updated`,
      );
    }
  };

  for (let index = 0; index < movies.length; index += concurrency) {
    const batch = movies.slice(index, index + concurrency);
    await Promise.all(batch.map((movie) => processMovie(movie)));

    await sleep(100);
  }

  console.log("");
  console.log(`Checked: ${movies.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log(`Updated: ${updated}`);
  console.log(shouldWrite ? "Mode: write" : "Mode: dry-run");
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
