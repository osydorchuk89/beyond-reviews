import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { createReadStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { get } from "https";
import { dirname } from "path";
import { createInterface } from "readline";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";

const prisma = new PrismaClient();

const DEFAULT_TARGET_REVIEWS = 206_000;
const BATCH_SIZE = 1_000;
const MAX_REVIEWS_PER_USER = 90;
const DEFAULT_IMDB_BASICS_URL =
    "https://datasets.imdbws.com/title.basics.tsv.gz";
const DEFAULT_IMDB_RATINGS_URL =
    "https://datasets.imdbws.com/title.ratings.tsv.gz";
const DEFAULT_IMDB_CACHE_DIR = "dev/.cache/imdb";

type CliOptions = {
    target: number;
    seed: number;
    reset: boolean;
    dryRun: boolean;
    withActivities: boolean;
    imdbBasicsPath?: string;
    imdbRatingsPath?: string;
    imdbDownload: boolean;
    requireImdbMatch: boolean;
};

type MovieSeedData = {
    id: string;
    title: string;
    releaseYear: number;
    director: string;
    genres: string[];
    popularity: number;
    avgRating: number;
    numRatings: number;
};

type MoviePlan = MovieSeedData & {
    targetReviewCount: number;
    expectedRating: number;
    sentimentMix: SentimentMix;
    ratingSource: "imdb" | "fallback";
    imdbVotes?: number;
};

type UserSeedData = {
    id: string;
};

type ExternalMovieRating = {
    rating: number;
    votes: number;
};

type Sentiment = "positive" | "neutral" | "negative";

type SentimentMix = Record<Sentiment, number>;

type Rng = () => number;

type SyntheticReview = {
    movieId: string;
    userId: string;
    date: Date;
    rating: number;
    text: string | null;
    likeCount: number;
};

const parseArgs = (): CliOptions => {
    const options: CliOptions = {
        target: DEFAULT_TARGET_REVIEWS,
        seed: 42,
        reset: false,
        dryRun: false,
        withActivities: false,
        imdbDownload: false,
        requireImdbMatch: false,
    };

    for (const arg of process.argv.slice(2)) {
        const [key, rawValue] = arg.split("=");
        const value = rawValue?.trim();

        if (key === "--target" && value) {
            options.target = Number(value.replaceAll("_", ""));
        }
        if (key === "--seed" && value) {
            options.seed = Number(value);
        }
        if (key === "--reset") {
            options.reset = true;
        }
        if (key === "--dry-run") {
            options.dryRun = true;
        }
        if (key === "--with-activities") {
            options.withActivities = true;
        }
        if (key === "--imdb-basics" && value) {
            options.imdbBasicsPath = value;
        }
        if (key === "--imdb-ratings" && value) {
            options.imdbRatingsPath = value;
        }
        if (key === "--imdb-download") {
            options.imdbDownload = true;
            options.imdbBasicsPath = `${DEFAULT_IMDB_CACHE_DIR}/title.basics.tsv.gz`;
            options.imdbRatingsPath = `${DEFAULT_IMDB_CACHE_DIR}/title.ratings.tsv.gz`;
        }
        if (key === "--require-imdb-match") {
            options.requireImdbMatch = true;
        }
    }

    if (!Number.isInteger(options.target) || options.target <= 0) {
        throw new Error("--target must be a positive integer");
    }
    if (!Number.isInteger(options.seed)) {
        throw new Error("--seed must be an integer");
    }
    if (options.imdbBasicsPath && !options.imdbRatingsPath) {
        throw new Error("--imdb-basics requires --imdb-ratings");
    }
    if (!options.imdbBasicsPath && options.imdbRatingsPath) {
        throw new Error("--imdb-ratings requires --imdb-basics");
    }

    return options;
};

const createRng = (seed: number): Rng => {
    let state = seed >>> 0;

    return () => {
        state += 0x6d2b79f5;
        let result = state;
        result = Math.imul(result ^ (result >>> 15), result | 1);
        result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
        return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
    };
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const gaussian = (rng: Rng) => {
    const u = Math.max(rng(), Number.EPSILON);
    const v = Math.max(rng(), Number.EPSILON);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

const weightedChoiceIndex = (weights: number[], rng: Rng) => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = rng() * total;

    for (let i = 0; i < weights.length; i++) {
        cursor -= weights[i];
        if (cursor <= 0) {
            return i;
        }
    }

    return weights.length - 1;
};

const uniqueSample = <T>(items: T[], count: number, rng: Rng): T[] => {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy.slice(0, count);
};

const sampleUsersExcept = (
    users: UserSeedData[],
    count: number,
    excludedUserId: string,
    rng: Rng,
) => {
    const selectedIndexes = new Set<number>();
    const result: UserSeedData[] = [];
    const maxCount = Math.min(count, Math.max(0, users.length - 1));

    while (result.length < maxCount) {
        const index = Math.floor(rng() * users.length);
        const user = users[index];

        if (selectedIndexes.has(index) || user.id === excludedUserId) {
            continue;
        }

        selectedIndexes.add(index);
        result.push(user);
    }

    return result;
};

const normalizePublicRating = (rating: number) => {
    if (!Number.isFinite(rating) || rating <= 0) {
        return 0;
    }

    return rating > 10 ? rating / 10 : rating;
};

const titleKey = (title: string, year: number | string) =>
    `${title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()}|${year}`;

const parsePositiveInt = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const downloadFile = async (url: string, destinationPath: string) => {
    await mkdir(dirname(destinationPath), {
        recursive: true,
    });

    console.log(`Downloading ${url}...`);

    await new Promise<void>((resolve, reject) => {
        get(url, (response) => {
            if (
                response.statusCode &&
                response.statusCode >= 300 &&
                response.statusCode < 400 &&
                response.headers.location
            ) {
                downloadFile(response.headers.location, destinationPath)
                    .then(resolve)
                    .catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(
                    new Error(
                        `Failed to download ${url}: HTTP ${response.statusCode}`,
                    ),
                );
                response.resume();
                return;
            }

            pipeline(response, createWriteStream(destinationPath))
                .then(() => resolve())
                .catch(reject);
        }).on("error", reject);
    });
};

const isRemoteSource = (source: string) => /^https?:\/\//i.test(source);

const lineReaderFor = (source: string) => {
    if (isRemoteSource(source)) {
        throw new Error("Remote IMDb source must be downloaded before parsing");
    }

    const input = source.endsWith(".gz")
        ? createReadStream(source).pipe(createGunzip())
        : createReadStream(source);

    return createInterface({
        input,
        crlfDelay: Infinity,
    });
};

const sentimentMixFromImdbRating = (rating: number): SentimentMix => {
    const normalized = clamp(rating, 1, 10);
    const quality = (normalized - 1) / 9;
    const positive = clamp(0.05 + Math.pow(quality, 1.7) * 0.86, 0.05, 0.91);
    const negative = clamp(0.04 + Math.pow(1 - quality, 1.65) * 0.78, 0.04, 0.82);
    const neutral = Math.max(0.05, 1 - positive - negative);
    const total = positive + neutral + negative;

    return {
        positive: positive / total,
        neutral: neutral / total,
        negative: negative / total,
    };
};

const fallbackExpectedRatingForMovie = (movie: MovieSeedData) => {
    const publicRating = normalizePublicRating(movie.avgRating);

    if (publicRating > 0) {
        return publicRating;
    }

    const popularitySignal = clamp(Math.log10(movie.popularity + 1) / 2.25, 0, 1);
    const voteSignal = clamp(Math.log10(Math.max(1, movie.numRatings)) / 5.5, 0, 1);
    const releasePenalty = movie.releaseYear > new Date().getFullYear() ? -0.35 : 0;

    return clamp(5.2 + popularitySignal * 1.6 + voteSignal * 0.8 + releasePenalty, 4.8, 7.8);
};

const loadImdbMovieRatings = async (
    basicsPath: string,
    ratingsPath: string,
) => {
    const ratingsById = new Map<string, ExternalMovieRating>();
    const ratingsReader = lineReaderFor(ratingsPath);

    for await (const line of ratingsReader) {
        if (line.startsWith("tconst\t")) {
            continue;
        }

        const [tconst, averageRating, numVotes] = line.split("\t");
        const rating = Number.parseFloat(averageRating);
        const votes = Number.parseInt(numVotes, 10);

        if (tconst && Number.isFinite(rating) && Number.isFinite(votes)) {
            ratingsById.set(tconst, { rating, votes });
        }
    }

    const ratingsByTitleYear = new Map<string, ExternalMovieRating>();
    const basicsReader = lineReaderFor(basicsPath);

    for await (const line of basicsReader) {
        if (line.startsWith("tconst\t")) {
            continue;
        }

        const [
            tconst,
            titleType,
            primaryTitle,
            originalTitle,
            isAdult,
            startYear,
        ] = line.split("\t");
        const rating = ratingsById.get(tconst);
        const year = parsePositiveInt(startYear);

        if (
            !rating ||
            !year ||
            isAdult === "1" ||
            !["movie", "tvMovie"].includes(titleType)
        ) {
            continue;
        }

        for (const title of [primaryTitle, originalTitle]) {
            if (!title || title === "\\N") {
                continue;
            }

            const key = titleKey(title, year);
            const existing = ratingsByTitleYear.get(key);
            if (!existing || rating.votes > existing.votes) {
                ratingsByTitleYear.set(key, rating);
            }
        }
    }

    return ratingsByTitleYear;
};

const externalRatingForMovie = (
    movie: MovieSeedData,
    ratingsByTitleYear?: Map<string, ExternalMovieRating>,
) => ratingsByTitleYear?.get(titleKey(movie.title, movie.releaseYear));

const moviePopularityWeight = (movie: MovieSeedData) => {
    const popularity = Math.max(0, movie.popularity);
    const voteSignal = Math.log10(Math.max(1, movie.numRatings));
    const ratingSignal = clamp(fallbackExpectedRatingForMovie(movie), 1, 10);
    const ageSignal = clamp(
        1 + (movie.releaseYear - 1980) / 130,
        0.65,
        1.35,
    );

    return (
        Math.pow(popularity + 1, 1.25) *
        Math.pow(voteSignal + 1, 0.8) *
        Math.pow(ratingSignal / 6.5, 0.45) *
        ageSignal
    );
};

const allocateReviewCounts = (
    movies: MovieSeedData[],
    targetReviews: number,
    maxPerMovie: number,
    rng: Rng,
    ratingsByTitleYear?: Map<string, ExternalMovieRating>,
): MoviePlan[] => {
    const weights = movies.map(moviePopularityWeight);
    const counts = Array.from({ length: movies.length }, () => 0);
    const capped = new Set<number>();
    const capacity = movies.length * maxPerMovie;
    const actualTarget = Math.min(targetReviews, capacity);

    for (let allocated = 0; allocated < actualTarget; allocated++) {
        const activeWeights = weights.map((weight, index) =>
            capped.has(index) ? 0 : weight,
        );
        const movieIndex = weightedChoiceIndex(activeWeights, rng);
        counts[movieIndex]++;

        if (counts[movieIndex] >= maxPerMovie) {
            capped.add(movieIndex);
        }
    }

    return movies.map((movie, index) => {
        const imdbRating = externalRatingForMovie(movie, ratingsByTitleYear);
        const expectedRating = imdbRating?.rating ?? fallbackExpectedRatingForMovie(movie);

        return {
            ...movie,
            targetReviewCount: counts[index],
            expectedRating,
            sentimentMix: sentimentMixFromImdbRating(expectedRating),
            ratingSource: imdbRating ? "imdb" : "fallback",
            imdbVotes: imdbRating?.votes,
        };
    });
};

const sentimentForMovie = (mix: SentimentMix, rng: Rng): Sentiment => {
    const roll = rng();

    if (roll < mix.positive) {
        return "positive";
    }
    if (roll < mix.positive + mix.neutral) {
        return "neutral";
    }

    return "negative";
};

const ratingForMovie = (movie: MoviePlan, rng: Rng) => {
    const sentiment = sentimentForMovie(movie.sentimentMix, rng);
    const expected = clamp(movie.expectedRating, 1, 10);

    if (sentiment === "positive") {
        const center = clamp(Math.max(8, expected + 0.9), 8, 9.5);
        return Math.round(clamp(center + gaussian(rng) * 0.85, 8, 10));
    }
    if (sentiment === "neutral") {
        const center = clamp(expected, 5, 7);
        return Math.round(clamp(center + gaussian(rng) * 0.9, 5, 7));
    }

    const center = clamp(Math.min(4, expected - 1.2), 1.8, 4);
    return Math.round(clamp(center + gaussian(rng) * 1, 1, 4));
};

const reviewDate = (releaseYear: number, rng: Rng) => {
    const startYear = clamp(releaseYear, 1985, new Date().getFullYear());
    const recentBias = Math.pow(rng(), 0.45);
    const year =
        startYear +
        Math.floor((new Date().getFullYear() - startYear + 1) * recentBias);

    return faker.date.between({
        from: new Date(year, 0, 1),
        to: new Date(year, 11, 31),
    });
};

const pick = <T>(items: T[], rng: Rng): T =>
    items[Math.floor(rng() * items.length)];

const maybe = (chance: number, rng: Rng) => rng() < chance;

const sentence = (text: string) =>
    `${text.charAt(0).toUpperCase()}${text.slice(1)}`.replace(/\s+/g, " ");

const reviewOpeners = {
    positive: [
        "{title} really worked for me.",
        "I had a great time with {title}.",
        "This one clicked almost immediately.",
        "I went in curious and came out pretty impressed.",
        "{title} has the kind of energy I wish more movies had.",
        "I can see why people keep talking about {title}.",
    ],
    neutral: [
        "{title} is a mixed bag for me.",
        "I liked parts of {title}, but not all of it.",
        "This was decent, though uneven.",
        "I am somewhere in the middle on this one.",
        "There is a good movie in here, even if it does not always come through.",
        "{title} kept my attention, but I wanted a bit more from it.",
    ],
    negative: [
        "{title} did not really land for me.",
        "I wanted to like this more than I did.",
        "This one was a struggle to finish.",
        "{title} has a few ideas, but they never came together for me.",
        "I can see the intention, but the result felt flat.",
        "This just was not my thing.",
    ],
} satisfies Record<Sentiment, string[]>;

const performanceNotes = {
    positive: [
        "the cast makes even the quiet scenes feel alive",
        "the performances give the story a real pulse",
        "the leads sell the emotional turns without overplaying them",
        "the characters feel more lived-in than I expected",
        "there is a nice confidence in how everyone plays it",
    ],
    neutral: [
        "the performances are solid, even when the script gets thin",
        "some characters work better than others",
        "the cast does enough to keep it watchable",
        "a few scenes feel natural, while others are a bit forced",
        "the acting is not the problem, but it cannot fix everything either",
    ],
    negative: [
        "the characters never felt like real people to me",
        "the performances are trying, but the material does not help them",
        "too many emotional beats feel unearned",
        "the cast seems trapped in scenes that do not build anywhere",
        "I never felt invested in who these people were",
    ],
} satisfies Record<Sentiment, string[]>;

const pacingNotes = {
    positive: [
        "the pacing keeps things moving without rushing the good moments",
        "it knows when to slow down and when to push forward",
        "the runtime feels earned",
        "there is barely a dead stretch",
        "it builds momentum in a really satisfying way",
    ],
    neutral: [
        "the middle section drags a little",
        "the pacing is uneven but not fatal",
        "it takes a while to find its rhythm",
        "some scenes could have been tighter",
        "it works best when it stops trying to do too much",
    ],
    negative: [
        "the pacing makes it feel longer than it is",
        "too many scenes sit there without adding much",
        "it loses momentum early and never fully gets it back",
        "the slow parts are not interesting enough to justify themselves",
        "it feels both rushed and dragged out somehow",
    ],
} satisfies Record<Sentiment, string[]>;

const craftNotes = {
    positive: [
        "the score and visuals add a lot of texture",
        "the direction has a clear sense of purpose",
        "the whole thing feels carefully assembled",
        "the best scenes have a simple, confident touch",
        "it has a strong atmosphere without trying too hard",
    ],
    neutral: [
        "the style is nice, but it sometimes covers for thin writing",
        "there are some good visual ideas here",
        "the craft is stronger than the story in places",
        "the tone shifts are not always smooth",
        "it has moments that look better than they feel",
    ],
    negative: [
        "the style feels like it is compensating for a weak story",
        "the direction never gives the scenes much shape",
        "it looks polished, but there is not much underneath",
        "the tone is all over the place",
        "nothing about the filmmaking pulled me in",
    ],
} satisfies Record<Sentiment, string[]>;

const genreNotes: Record<string, Record<Sentiment, string[]>> = {
    Action: {
        positive: [
            "the action is clear, punchy, and easy to follow",
            "the set pieces actually have weight",
        ],
        neutral: [
            "some action scenes hit harder than others",
            "the action is fine, though not especially memorable",
        ],
        negative: [
            "the action feels noisy without much tension",
            "the big moments are edited too busily to make an impact",
        ],
    },
    Adventure: {
        positive: [
            "it captures that feeling of a proper journey",
            "the sense of discovery carries a lot of it",
        ],
        neutral: [
            "the adventure elements are fun when the story lets them breathe",
            "the journey is better than the destination",
        ],
        negative: [
            "the adventure never feels as big as it should",
            "it keeps promising discovery without making much feel surprising",
        ],
    },
    Animation: {
        positive: [
            "the animation gives the emotional beats extra warmth",
            "there is so much personality in the visual details",
        ],
        neutral: [
            "the animation is expressive even when the story gets familiar",
            "the visuals do more for me than the plot",
        ],
        negative: [
            "the animation is busy, but the story feels empty",
            "it looks fine, but the characters did not stick with me",
        ],
    },
    Comedy: {
        positive: [
            "the jokes land more often than not",
            "it has an easy comic rhythm that won me over",
        ],
        neutral: [
            "the humor is hit or miss",
            "I laughed a few times, but not as much as I hoped",
        ],
        negative: [
            "most of the jokes felt strained",
            "the comedy keeps reaching for laughs it does not earn",
        ],
    },
    Crime: {
        positive: [
            "it has a great feel for bad decisions piling up",
            "the crime elements add real tension",
        ],
        neutral: [
            "the crime story has good pieces, even if it is familiar",
            "the tension comes and goes",
        ],
        negative: [
            "the crime angle feels routine",
            "it never finds the danger or pressure it seems to want",
        ],
    },
    Drama: {
        positive: [
            "the drama feels honest without getting too heavy-handed",
            "the quiet scenes are where it really shines",
        ],
        neutral: [
            "the drama works in pieces",
            "some emotional moments hit, others feel a little staged",
        ],
        negative: [
            "the drama feels manufactured",
            "it asks for emotion without doing the work to earn it",
        ],
    },
    Horror: {
        positive: [
            "the mood is creepy in a way that sticks",
            "it understands dread better than cheap shocks",
        ],
        neutral: [
            "the atmosphere is better than the scares",
            "some tense scenes work, but the fear fades quickly",
        ],
        negative: [
            "the scares are too predictable",
            "it never made me feel as uneasy as it wanted to",
        ],
    },
    Romance: {
        positive: [
            "the chemistry feels natural",
            "the romance works because the small moments feel specific",
        ],
        neutral: [
            "the chemistry is there, but the story around it is uneven",
            "the romantic parts are sweet, if a little familiar",
        ],
        negative: [
            "the romance never felt convincing to me",
            "the chemistry is not strong enough to carry it",
        ],
    },
    "Science Fiction": {
        positive: [
            "the sci-fi idea stays connected to something human",
            "the concept is used for more than just spectacle",
        ],
        neutral: [
            "the sci-fi ideas are interesting, even when the story simplifies them",
            "the concept is stronger than the follow-through",
        ],
        negative: [
            "the sci-fi parts feel underdeveloped",
            "it has a premise, but not enough curiosity about it",
        ],
    },
    Thriller: {
        positive: [
            "the tension is handled with real patience",
            "it keeps enough uncertainty alive to stay gripping",
        ],
        neutral: [
            "the suspense works in stretches",
            "a few twists land better than others",
        ],
        negative: [
            "the tension never really tightens",
            "the twists feel more mechanical than surprising",
        ],
    },
};

const closers = {
    positive: [
        "I would happily watch it again.",
        "Not perfect, but very easy to recommend.",
        "It left me in a better mood than I expected.",
        "I get the hype.",
        "This is exactly the kind of movie I hope to stumble into.",
        "It has stayed with me more than I thought it would.",
    ],
    neutral: [
        "I do not regret watching it, but I doubt I will revisit it.",
        "Worth a look if the premise already interests you.",
        "I am glad I saw it, even if I have reservations.",
        "Your mileage may vary on this one.",
        "There is enough here to like, just not enough to love.",
        "It is fine, which sounds harsher than I mean it.",
    ],
    negative: [
        "Once was enough for me.",
        "I would have a hard time recommending it.",
        "A few decent moments are not enough to save it.",
        "I mostly felt detached from it.",
        "It may work for someone else, but it missed me.",
        "By the end, I was ready for it to be over.",
    ],
} satisfies Record<Sentiment, string[]>;

const personalAsides = [
    "Maybe I was not in the perfect mood for it.",
    "I watched it on a quiet night, which probably helped.",
    "I expected something different from the trailer.",
    "I can imagine liking it more on a rewatch.",
    "This is one of those movies where my opinion shifted as it went.",
    "I know this one has fans, and I can see why.",
    "I went in knowing almost nothing.",
    "The last act changed my mind a bit.",
];

const casualPrefixes = [
    "Honestly, ",
    "For me, ",
    "Surprisingly, ",
    "At least to me, ",
    "I will say, ",
    "The thing is, ",
    "",
    "",
];

const sentimentForRating = (rating: number): Sentiment => {
    if (rating >= 8) {
        return "positive";
    }
    if (rating >= 5) {
        return "neutral";
    }

    return "negative";
};

const interpolateReviewText = (template: string, movie: MoviePlan) =>
    template
        .replaceAll("{title}", movie.title)
        .replaceAll("{director}", movie.director)
        .replaceAll("{year}", `${movie.releaseYear}`);

const genreNoteFor = (movie: MoviePlan, sentiment: Sentiment, rng: Rng) => {
    const matchingGenres = movie.genres
        .map((genre) => genreNotes[genre]?.[sentiment])
        .filter((notes): notes is string[] => Boolean(notes?.length));

    if (matchingGenres.length === 0) {
        return null;
    }

    return pick(pick(matchingGenres, rng), rng);
};

const localReviewTextFor = (movie: MoviePlan, rating: number, rng: Rng) => {
    if (maybe(0.12, rng)) {
        return null;
    }

    const sentiment = sentimentForRating(rating);
    const availableNotes = [
        pick(performanceNotes[sentiment], rng),
        pick(pacingNotes[sentiment], rng),
        pick(craftNotes[sentiment], rng),
        genreNoteFor(movie, sentiment, rng),
    ].filter((note): note is string => Boolean(note));
    const noteA = pick(availableNotes, rng);
    const noteB = pick(
        availableNotes.filter((note) => note !== noteA).length
            ? availableNotes.filter((note) => note !== noteA)
            : availableNotes,
        rng,
    );
    const opener = interpolateReviewText(pick(reviewOpeners[sentiment], rng), movie);
    const prefix = pick(casualPrefixes, rng);
    const closer = pick(closers[sentiment], rng);
    const formats = [
        `${opener} ${sentence(noteA)}. ${closer}`,
        `${prefix}${noteA}. ${sentence(noteB)}. ${closer}`,
        `${opener} ${sentence(noteA)}, and ${noteB}.`,
        `${pick(personalAsides, rng)} ${sentence(noteA)}. ${closer}`,
        `${opener} ${sentence(noteA)}.`,
        `${prefix}${noteA}. ${sentence(noteB)}.`,
    ];

    return sentence(interpolateReviewText(pick(formats, rng), movie)).trim();
};

const likedByCountFor = (reviewRating: number, movieReviewCount: number, rng: Rng) => {
    const base =
        reviewRating >= 8 ? 1.4 : reviewRating >= 5 ? 0.8 : reviewRating <= 3 ? 1 : 0.45;
    const movieScale = Math.log10(movieReviewCount + 10) / 3;
    const raw = Math.max(0, Math.round((base + gaussian(rng)) * movieScale));
    const viral = rng() < 0.015 ? Math.floor(rng() * 18) : 0;
    return clamp(raw + viral, 0, 30);
};

const chunkedCreateMany = async <T>(
    label: string,
    data: T[],
    createMany: (chunk: T[]) => Promise<unknown>,
) => {
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const chunk = data.slice(i, i + BATCH_SIZE);
        await createMany(chunk);
        console.log(`${label}: ${Math.min(i + chunk.length, data.length)}/${data.length}`);
    }
};

const resetSyntheticReviewData = async () => {
    console.log("Deleting existing review likes, review activities, and movie reviews...");
    await prisma.movieReviewLike.deleteMany({});
    await prisma.activity.deleteMany({
        where: {
            OR: [
                { movieReviewId: { not: null } },
                { action: "rated" },
            ],
        },
    });
    await prisma.movieReview.deleteMany({});
    await prisma.movie.updateMany({
        data: {
            avgRating: 0,
            numRatings: 0,
        },
    });
};

async function main() {
    const options = parseArgs();
    const rng = createRng(options.seed);

    faker.seed(options.seed);

    const [movies, users] = await Promise.all([
        prisma.movie.findMany({
            select: {
                id: true,
                title: true,
                releaseYear: true,
                director: true,
                genres: true,
                popularity: true,
                avgRating: true,
                numRatings: true,
            },
        }),
        prisma.user.findMany({
            select: {
                id: true,
            },
        }),
    ]);

    if (movies.length === 0) {
        throw new Error("No movies found. Seed movies before generating reviews.");
    }
    if (users.length === 0) {
        throw new Error("No users found. Seed users before generating reviews.");
    }

    if (options.imdbDownload) {
        await Promise.all([
            downloadFile(DEFAULT_IMDB_BASICS_URL, options.imdbBasicsPath!),
            downloadFile(DEFAULT_IMDB_RATINGS_URL, options.imdbRatingsPath!),
        ]);
    }

    const imdbRatings =
        options.imdbBasicsPath && options.imdbRatingsPath
            ? await loadImdbMovieRatings(
                  options.imdbBasicsPath,
                  options.imdbRatingsPath,
              )
            : undefined;

    const maxPossibleReviews = movies.length * users.length;
    const target = Math.min(options.target, maxPossibleReviews);
    const perMovieCap = users.length;
    const plannedMovies = allocateReviewCounts(
        movies,
        target,
        perMovieCap,
        rng,
        imdbRatings,
    )
        .filter((movie) => movie.targetReviewCount > 0)
        .sort((a, b) => b.targetReviewCount - a.targetReviewCount);

    const imdbMatchedMovies = plannedMovies.filter(
        (movie) => movie.ratingSource === "imdb",
    ).length;
    const imdbMatchedReviews = plannedMovies
        .filter((movie) => movie.ratingSource === "imdb")
        .reduce((sum, movie) => sum + movie.targetReviewCount, 0);

    if (options.requireImdbMatch && imdbMatchedMovies < plannedMovies.length) {
        throw new Error(
            `IMDb match required, but only ${imdbMatchedMovies}/${plannedMovies.length} planned movies matched by title and year.`,
        );
    }

    const plannedReviewTotal = plannedMovies.reduce(
        (sum, movie) => sum + movie.targetReviewCount,
        0,
    );

    console.log(`Movies: ${movies.length}`);
    console.log(`Users: ${users.length}`);
    console.log(`Target reviews: ${target.toLocaleString()}`);
    console.log(`Planned reviews: ${plannedReviewTotal.toLocaleString()}`);
    console.log("Review text: local template generator");
    if (imdbRatings) {
        console.log(
            `IMDb matched: ${imdbMatchedMovies}/${plannedMovies.length} planned movies, ${imdbMatchedReviews.toLocaleString()}/${plannedReviewTotal.toLocaleString()} planned reviews`,
        );
    } else {
        console.log(
            "IMDb source: not provided, using fallback rating signals for sentiment distribution",
        );
    }
    console.log("Top planned review counts:");
    for (const movie of plannedMovies.slice(0, 12)) {
        console.log(
            `- ${movie.title} (${movie.releaseYear}): ${movie.targetReviewCount} reviews, ${movie.ratingSource} avg ${movie.expectedRating.toFixed(1)}, +${Math.round(movie.sentimentMix.positive * 100)}% / ~${Math.round(movie.sentimentMix.neutral * 100)}% / -${Math.round(movie.sentimentMix.negative * 100)}%`,
        );
    }

    if (options.dryRun) {
        const previewRng = createRng(options.seed + 10_000);
        console.log("Sample generated review text:");
        for (const movie of plannedMovies.slice(0, 5)) {
            const rating = ratingForMovie(movie, previewRng);
            const text = localReviewTextFor(movie, rating, previewRng);
            console.log(
                `- ${movie.title} (${rating}/10): ${text ?? "[rating only]"}`,
            );
        }
        return;
    }

    const existingReviewCount = await prisma.movieReview.count();
    if (existingReviewCount > 0 && !options.reset) {
        throw new Error(
            `Found ${existingReviewCount.toLocaleString()} existing reviews. Re-run with --reset to replace them.`,
        );
    }

    if (options.reset) {
        await resetSyntheticReviewData();
    }

    const allReviews: SyntheticReview[] = [];
    const userReviewCounts = new Map<string, number>();
    const movieAggregates = new Map<string, { sum: number; count: number }>();
    const moviePlanById = new Map(plannedMovies.map((movie) => [movie.id, movie]));

    for (const movie of plannedMovies) {
        const underusedUsers = users.filter(
            (user) => (userReviewCounts.get(user.id) ?? 0) < MAX_REVIEWS_PER_USER,
        );
        const pool = underusedUsers.length >= movie.targetReviewCount ? underusedUsers : users;
        const reviewers = uniqueSample(pool, movie.targetReviewCount, rng);

        for (const user of reviewers) {
            const rating = ratingForMovie(movie, rng);

            allReviews.push({
                movieId: movie.id,
                userId: user.id,
                date: reviewDate(movie.releaseYear, rng),
                rating,
                text: localReviewTextFor(movie, rating, rng),
                likeCount: 0,
            });

            userReviewCounts.set(user.id, (userReviewCounts.get(user.id) ?? 0) + 1);

            const aggregate = movieAggregates.get(movie.id) ?? { sum: 0, count: 0 };
            aggregate.sum += rating;
            aggregate.count++;
            movieAggregates.set(movie.id, aggregate);
        }
    }

    await chunkedCreateMany("Reviews", allReviews, (chunk) =>
        prisma.movieReview.createMany({ data: chunk }),
    );

    const createdReviews = await prisma.movieReview.findMany({
        select: {
            id: true,
            userId: true,
            rating: true,
            movieId: true,
        },
    });
    const reviewLikes: { reviewId: string; userId: string }[] = [];
    const reviewLikeCounts = new Map<string, number>();

    for (const review of createdReviews) {
        const movie = moviePlanById.get(review.movieId);
        if (!movie) {
            continue;
        }

        const likeCount = likedByCountFor(review.rating, movie.targetReviewCount, rng);
        reviewLikeCounts.set(review.id, likeCount);

        for (const user of sampleUsersExcept(users, likeCount, review.userId, rng)) {
            reviewLikes.push({
                reviewId: review.id,
                userId: user.id,
            });
        }
    }

    await chunkedCreateMany("Review likes", reviewLikes, (chunk) =>
        prisma.movieReviewLike.createMany({ data: chunk }),
    );

    for (const [reviewId, likeCount] of reviewLikeCounts) {
        await prisma.movieReview.update({
            where: { id: reviewId },
            data: { likeCount },
        });
    }

    if (options.withActivities) {
        const reviewActivities = createdReviews.map((review) => ({
            userId: review.userId,
            movieId: review.movieId,
            movieReviewId: review.id,
            action: "rated",
            reviewRating: review.rating,
            date: new Date(),
        }));

        await chunkedCreateMany("Review activities", reviewActivities, (chunk) =>
            prisma.activity.createMany({ data: chunk }),
        );
    }

    for (const [movieId, aggregate] of movieAggregates) {
        await prisma.movie.update({
            where: { id: movieId },
            data: {
                avgRating: aggregate.sum / aggregate.count,
                numRatings: aggregate.count,
            },
        });
    }

    console.log(
        `Done: ${allReviews.length.toLocaleString()} reviews and ${reviewLikes.length.toLocaleString()} likes created.`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
