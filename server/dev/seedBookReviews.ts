import "dotenv/config";

import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_TARGET_REVIEWS = 100_000;
const BATCH_SIZE = 1_000;
const MAX_REVIEWS_PER_USER = 80;

type CliOptions = {
  target: number;
  seed: number;
  reset: boolean;
  dryRun: boolean;
  withActivities: boolean;
};

type BookSeedData = {
  id: string;
  title: string;
  releaseYear: number;
  authors: string[];
  genres: string[];
  popularity: number;
  avgRating: number;
  numRatings: number;
  pageCount: number | null;
};

type UserSeedData = {
  id: string;
};

type BookPlan = BookSeedData & {
  targetReviewCount: number;
  expectedRating: number;
  sentimentMix: SentimentMix;
};

type Sentiment = "positive" | "neutral" | "negative";
type SentimentMix = Record<Sentiment, number>;
type Rng = () => number;

type SyntheticReview = {
  bookId: string;
  userId: string;
  date: Date;
  rating: number;
  text: string | null;
  likeCount: number;
  mediaType: "BOOK";
};

const parseArgs = (): CliOptions => {
  const options: CliOptions = {
    target: DEFAULT_TARGET_REVIEWS,
    seed: 73,
    reset: false,
    dryRun: false,
    withActivities: false,
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
  }

  if (!Number.isInteger(options.target) || options.target <= 0) {
    throw new Error("--target must be a positive integer");
  }
  if (!Number.isInteger(options.seed)) {
    throw new Error("--seed must be an integer");
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

  for (let index = 0; index < weights.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return index;
  }

  return weights.length - 1;
};

const uniqueSample = <T>(items: T[], count: number, rng: Rng): T[] => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
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

    if (selectedIndexes.has(index) || user.id === excludedUserId) continue;

    selectedIndexes.add(index);
    result.push(user);
  }

  return result;
};

const pick = <T>(items: T[], rng: Rng): T =>
  items[Math.floor(rng() * items.length)];

const maybe = (chance: number, rng: Rng) => rng() < chance;

const sentence = (text: string) =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`.replace(/\s+/g, " ");

const normalizePublicRating = (rating: number) => {
  if (!Number.isFinite(rating) || rating <= 0) return 0;
  return rating > 10 ? rating / 10 : rating;
};

const expectedRatingForBook = (book: BookSeedData) => {
  const publicRating = normalizePublicRating(book.avgRating);
  if (publicRating > 0) return publicRating;

  const popularitySignal = clamp(Math.log10(book.popularity + 1) / 3.7, 0, 1);
  const ratingSignal = clamp(Math.log10(Math.max(1, book.numRatings)) / 4.2, 0, 1);

  return clamp(5.4 + popularitySignal * 1.4 + ratingSignal * 0.8, 4.8, 8.2);
};

const sentimentMixFromRating = (rating: number): SentimentMix => {
  const normalized = clamp(rating, 1, 10);
  const quality = (normalized - 1) / 9;
  const positive = clamp(0.08 + Math.pow(quality, 1.55) * 0.82, 0.08, 0.9);
  const negative = clamp(0.04 + Math.pow(1 - quality, 1.8) * 0.7, 0.04, 0.76);
  const neutral = Math.max(0.06, 1 - positive - negative);
  const total = positive + neutral + negative;

  return {
    positive: positive / total,
    neutral: neutral / total,
    negative: negative / total,
  };
};

const bookPopularityWeight = (book: BookSeedData) => {
  const popularity = Math.max(0, book.popularity);
  const voteSignal = Math.log10(Math.max(1, book.numRatings));
  const ratingSignal = clamp(expectedRatingForBook(book), 1, 10);
  const pageSignal = book.pageCount ? clamp(book.pageCount / 450, 0.7, 1.25) : 1;

  return (
    Math.pow(popularity + 1, 0.9) *
    Math.pow(voteSignal + 1, 0.65) *
    Math.pow(ratingSignal / 6.7, 0.6) *
    pageSignal
  );
};

const allocateReviewCounts = (
  books: BookSeedData[],
  targetReviews: number,
  maxPerBook: number,
  rng: Rng,
): BookPlan[] => {
  const weights = books.map(bookPopularityWeight);
  const counts = Array.from({ length: books.length }, () => 0);
  const capped = new Set<number>();
  const actualTarget = Math.min(targetReviews, books.length * maxPerBook);

  for (let allocated = 0; allocated < actualTarget; allocated += 1) {
    const activeWeights = weights.map((weight, index) =>
      capped.has(index) ? 0 : weight,
    );
    const bookIndex = weightedChoiceIndex(activeWeights, rng);
    counts[bookIndex] += 1;

    if (counts[bookIndex] >= maxPerBook) {
      capped.add(bookIndex);
    }
  }

  return books.map((book, index) => {
    const expectedRating = expectedRatingForBook(book);

    return {
      ...book,
      targetReviewCount: counts[index],
      expectedRating,
      sentimentMix: sentimentMixFromRating(expectedRating),
    };
  });
};

const sentimentForBook = (mix: SentimentMix, rng: Rng): Sentiment => {
  const roll = rng();

  if (roll < mix.positive) return "positive";
  if (roll < mix.positive + mix.neutral) return "neutral";

  return "negative";
};

const ratingForBook = (book: BookPlan, rng: Rng) => {
  const sentiment = sentimentForBook(book.sentimentMix, rng);
  const expected = clamp(book.expectedRating, 1, 10);

  if (sentiment === "positive") {
    const center = clamp(Math.max(8, expected + 0.75), 8, 9.4);
    return Math.round(clamp(center + gaussian(rng) * 0.8, 8, 10));
  }
  if (sentiment === "neutral") {
    const center = clamp(expected, 5, 7);
    return Math.round(clamp(center + gaussian(rng) * 0.95, 5, 7));
  }

  const center = clamp(Math.min(4, expected - 1.25), 1.8, 4.2);
  return Math.round(clamp(center + gaussian(rng) * 1, 1, 4));
};

const sentimentForRating = (rating: number): Sentiment => {
  if (rating >= 8) return "positive";
  if (rating >= 5) return "neutral";
  return "negative";
};

const reviewDate = (releaseYear: number, rng: Rng) => {
  const startYear = clamp(releaseYear, 1990, new Date().getFullYear());
  const recentBias = Math.pow(rng(), 0.42);
  const year =
    startYear +
    Math.floor((new Date().getFullYear() - startYear + 1) * recentBias);

  return faker.date.between({
    from: new Date(year, 0, 1),
    to: new Date(year, 11, 31),
  });
};

const reviewOpeners = {
  positive: [
    "{title} really worked for me.",
    "I can see why {title} has stayed with readers.",
    "This one pulled me in quickly.",
    "{title} was exactly the kind of read I needed.",
    "I went in curious and ended up pretty absorbed.",
  ],
  neutral: [
    "{title} is a mixed read for me.",
    "I liked parts of {title}, but not all of it.",
    "This was decent, though uneven.",
    "I am somewhere in the middle on this one.",
    "{title} kept me reading, but I wanted more from it.",
  ],
  negative: [
    "{title} did not really land for me.",
    "I wanted to like this more than I did.",
    "This one was a struggle to finish.",
    "{title} has a few ideas, but they never came together for me.",
    "This just was not my thing.",
  ],
} satisfies Record<Sentiment, string[]>;

const proseNotes = {
  positive: [
    "the prose has a rhythm that makes the pages move",
    "the writing feels clear without losing texture",
    "the best passages have real warmth",
    "the voice is confident and easy to settle into",
    "the language carries the mood beautifully",
  ],
  neutral: [
    "the prose is readable, though not especially memorable",
    "some chapters are much sharper than others",
    "the writing is strongest in the quieter moments",
    "the style works, but it occasionally gets repetitive",
    "the voice took me a while to settle into",
  ],
  negative: [
    "the prose kept pulling me out of the story",
    "the writing feels flatter than the premise deserves",
    "too many passages feel overexplained",
    "the style never really clicked for me",
    "the voice felt distant when I wanted it to be intimate",
  ],
} satisfies Record<Sentiment, string[]>;

const characterNotes = {
  positive: [
    "the characters feel specific and lived-in",
    "the emotional turns feel earned",
    "I cared about the people on the page",
    "the relationships give the story a lot of weight",
    "the character work is the main reason it stayed with me",
  ],
  neutral: [
    "some characters are more convincing than others",
    "I understood the characters more than I felt them",
    "the relationships work in pieces",
    "a few emotional beats land, while others feel rushed",
    "the side characters could have used more room",
  ],
  negative: [
    "the characters never felt fully real to me",
    "the emotional beats felt more stated than earned",
    "I had trouble caring about what happened to anyone",
    "the relationships felt thin",
    "the characters often seemed to serve the plot rather than live in it",
  ],
} satisfies Record<Sentiment, string[]>;

const pacingNotes = {
  positive: [
    "the pacing keeps the story moving without rushing it",
    "the structure gives every section a clear purpose",
    "it knows when to slow down and when to push forward",
    "I rarely felt the length",
    "the momentum builds in a satisfying way",
  ],
  neutral: [
    "the middle section drags a little",
    "the pacing is uneven but not fatal",
    "it takes a while to find its rhythm",
    "some chapters could have been tighter",
    "the ending works better than the setup",
  ],
  negative: [
    "the pacing makes it feel longer than it is",
    "too many chapters sit in place",
    "it loses momentum early and never fully gets it back",
    "the slow parts are not interesting enough to justify themselves",
    "the ending felt rushed after such a long build",
  ],
} satisfies Record<Sentiment, string[]>;

const genreNotes: Record<string, Record<Sentiment, string[]>> = {
  Fiction: {
    positive: ["it finds something honest in ordinary moments"],
    neutral: ["the everyday details work better than the larger arc"],
    negative: ["the realism feels oddly lifeless"],
  },
  Fantasy: {
    positive: ["the world has enough texture to feel inviting"],
    neutral: ["the worldbuilding is interesting, even if familiar"],
    negative: ["the worldbuilding never felt as vivid as it needed to"],
  },
  "Science Fiction": {
    positive: ["the ideas stay connected to human stakes"],
    neutral: ["the concept is stronger than the follow-through"],
    negative: ["the premise has more potential than the book uses"],
  },
  Mystery: {
    positive: ["the reveals feel fair without being obvious"],
    neutral: ["the mystery works in stretches"],
    negative: ["the mystery felt too mechanical to surprise me"],
  },
  Romance: {
    positive: ["the chemistry feels natural"],
    neutral: ["the romance is sweet, if a little familiar"],
    negative: ["the romance never felt convincing to me"],
  },
  Classics: {
    positive: ["it still feels alive rather than just important"],
    neutral: ["I respected it more than I loved it"],
    negative: ["I can see its place, but I did not enjoy reading it"],
  },
};

const closers = {
  positive: [
    "I would happily recommend it.",
    "Not perfect, but very easy to like.",
    "It has stayed with me more than I expected.",
    "I understand the praise.",
    "I closed it feeling satisfied.",
  ],
  neutral: [
    "I am glad I read it, even if I have reservations.",
    "Worth a look if the premise already interests you.",
    "There is enough here to like, just not enough to love.",
    "Your mileage may vary on this one.",
    "I do not regret reading it, but I doubt I will revisit it.",
  ],
  negative: [
    "Once was enough for me.",
    "I would have a hard time recommending it.",
    "A few decent moments are not enough to save it.",
    "I mostly felt detached from it.",
    "It may work for someone else, but it missed me.",
  ],
} satisfies Record<Sentiment, string[]>;

const personalAsides = [
  "Maybe I read it at the wrong time.",
  "I expected something different from the description.",
  "I can imagine another reader connecting with it more than I did.",
  "The last third changed my opinion a bit.",
  "I went in knowing almost nothing.",
  "This is one of those books where my opinion shifted as it went.",
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

const interpolateReviewText = (template: string, book: BookPlan) =>
  template
    .replaceAll("{title}", book.title)
    .replaceAll("{author}", book.authors[0] ?? "the author")
    .replaceAll("{year}", `${book.releaseYear}`);

const genreNoteFor = (book: BookPlan, sentiment: Sentiment, rng: Rng) => {
  const matchingGenres = book.genres
    .map((genre) => genreNotes[genre]?.[sentiment])
    .filter((notes): notes is string[] => Boolean(notes?.length));

  if (matchingGenres.length === 0) return null;

  return pick(pick(matchingGenres, rng), rng);
};

const localReviewTextFor = (book: BookPlan, rating: number, rng: Rng) => {
  if (maybe(0.1, rng)) return null;

  const sentiment = sentimentForRating(rating);
  const availableNotes = [
    pick(proseNotes[sentiment], rng),
    pick(characterNotes[sentiment], rng),
    pick(pacingNotes[sentiment], rng),
    genreNoteFor(book, sentiment, rng),
  ].filter((note): note is string => Boolean(note));
  const noteA = pick(availableNotes, rng);
  const noteB = pick(
    availableNotes.filter((note) => note !== noteA).length
      ? availableNotes.filter((note) => note !== noteA)
      : availableNotes,
    rng,
  );
  const opener = interpolateReviewText(pick(reviewOpeners[sentiment], rng), book);
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

  return sentence(interpolateReviewText(pick(formats, rng), book)).trim();
};

const likedByCountFor = (rating: number, bookReviewCount: number, rng: Rng) => {
  const base = rating >= 8 ? 1.35 : rating >= 5 ? 0.75 : rating <= 3 ? 0.9 : 0.4;
  const bookScale = Math.log10(bookReviewCount + 10) / 3;
  const raw = Math.max(0, Math.round((base + gaussian(rng)) * bookScale));
  const viral = rng() < 0.012 ? Math.floor(rng() * 15) : 0;
  return clamp(raw + viral, 0, 25);
};

const chunkedCreateMany = async <T>(
  label: string,
  data: T[],
  createMany: (chunk: T[]) => Promise<unknown>,
) => {
  for (let index = 0; index < data.length; index += BATCH_SIZE) {
    const chunk = data.slice(index, index + BATCH_SIZE);
    await createMany(chunk);
    console.log(`${label}: ${Math.min(index + chunk.length, data.length)}/${data.length}`);
  }
};

const resetSyntheticBookReviewData = async () => {
  console.log("Deleting existing book review likes, book review activities, and book reviews...");

  const bookReviews = await prisma.review.findMany({
    where: { mediaType: "BOOK" },
    select: { id: true },
  });
  const bookReviewIds = bookReviews.map((review) => review.id);

  for (let index = 0; index < bookReviewIds.length; index += BATCH_SIZE) {
    const ids = bookReviewIds.slice(index, index + BATCH_SIZE);
    await prisma.reviewLike.deleteMany({
      where: {
        reviewId: {
          in: ids,
        },
      },
    });
    await prisma.activity.deleteMany({
      where: {
        reviewId: {
          in: ids,
        },
      },
    });
  }

  await prisma.activity.deleteMany({
    where: {
      bookId: {
        not: null,
      },
      action: "rated",
    },
  });
  await prisma.review.deleteMany({
    where: {
      mediaType: "BOOK",
    },
  });
  await prisma.book.updateMany({
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

  const [books, users] = await Promise.all([
    prisma.book.findMany({
      select: {
        id: true,
        title: true,
        releaseYear: true,
        authors: true,
        genres: true,
        popularity: true,
        avgRating: true,
        numRatings: true,
        pageCount: true,
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
      },
    }),
  ]);

  if (books.length === 0) {
    throw new Error("No books found. Import books before generating reviews.");
  }
  if (users.length === 0) {
    throw new Error("No users found. Seed users before generating reviews.");
  }

  const maxPossibleReviews = books.length * users.length;
  const target = Math.min(options.target, maxPossibleReviews);
  const plannedBooks = allocateReviewCounts(books, target, users.length, rng)
    .filter((book) => book.targetReviewCount > 0)
    .sort((a, b) => b.targetReviewCount - a.targetReviewCount);
  const plannedReviewTotal = plannedBooks.reduce(
    (sum, book) => sum + book.targetReviewCount,
    0,
  );

  console.log(`Books: ${books.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Target reviews: ${target.toLocaleString()}`);
  console.log(`Planned reviews: ${plannedReviewTotal.toLocaleString()}`);
  console.log("Review text: local book template generator");
  console.log("Top planned review counts:");
  for (const book of plannedBooks.slice(0, 12)) {
    console.log(
      `- ${book.title} (${book.releaseYear}): ${book.targetReviewCount} reviews, expected avg ${book.expectedRating.toFixed(1)}, +${Math.round(book.sentimentMix.positive * 100)}% / ~${Math.round(book.sentimentMix.neutral * 100)}% / -${Math.round(book.sentimentMix.negative * 100)}%`,
    );
  }

  if (options.dryRun) {
    const previewRng = createRng(options.seed + 10_000);
    console.log("Sample generated review text:");
    for (const book of plannedBooks.slice(0, 5)) {
      const rating = ratingForBook(book, previewRng);
      const text = localReviewTextFor(book, rating, previewRng);
      console.log(`- ${book.title} (${rating}/10): ${text ?? "[rating only]"}`);
    }
    return;
  }

  const existingBookReviewCount = await prisma.review.count({
    where: { mediaType: "BOOK" },
  });
  if (existingBookReviewCount > 0 && !options.reset) {
    throw new Error(
      `Found ${existingBookReviewCount.toLocaleString()} existing book reviews. Re-run with --reset to replace them.`,
    );
  }

  if (options.reset) {
    await resetSyntheticBookReviewData();
  }

  const allReviews: SyntheticReview[] = [];
  const userReviewCounts = new Map<string, number>();
  const bookAggregates = new Map<string, { sum: number; count: number }>();
  const bookPlanById = new Map(plannedBooks.map((book) => [book.id, book]));

  for (const book of plannedBooks) {
    const underusedUsers = users.filter(
      (user) => (userReviewCounts.get(user.id) ?? 0) < MAX_REVIEWS_PER_USER,
    );
    const pool = underusedUsers.length >= book.targetReviewCount ? underusedUsers : users;
    const reviewers = uniqueSample(pool, book.targetReviewCount, rng);

    for (const user of reviewers) {
      const rating = ratingForBook(book, rng);

      allReviews.push({
        bookId: book.id,
        userId: user.id,
        date: reviewDate(book.releaseYear, rng),
        rating,
        text: localReviewTextFor(book, rating, rng),
        likeCount: 0,
        mediaType: "BOOK",
      });

      userReviewCounts.set(user.id, (userReviewCounts.get(user.id) ?? 0) + 1);

      const aggregate = bookAggregates.get(book.id) ?? { sum: 0, count: 0 };
      aggregate.sum += rating;
      aggregate.count += 1;
      bookAggregates.set(book.id, aggregate);
    }
  }

  await chunkedCreateMany("Book reviews", allReviews, (chunk) =>
    prisma.review.createMany({ data: chunk }),
  );

  const createdReviews = await prisma.review.findMany({
    where: { mediaType: "BOOK" },
    select: {
      id: true,
      userId: true,
      rating: true,
      bookId: true,
    },
  });
  const reviewLikes: { reviewId: string; userId: string }[] = [];
  const reviewLikeCounts = new Map<string, number>();

  for (const review of createdReviews) {
    if (!review.bookId) continue;

    const book = bookPlanById.get(review.bookId);
    if (!book) continue;

    const likeCount = likedByCountFor(review.rating, book.targetReviewCount, rng);
    reviewLikeCounts.set(review.id, likeCount);

    for (const user of sampleUsersExcept(users, likeCount, review.userId, rng)) {
      reviewLikes.push({
        reviewId: review.id,
        userId: user.id,
      });
    }
  }

  await chunkedCreateMany("Book review likes", reviewLikes, (chunk) =>
    prisma.reviewLike.createMany({ data: chunk }),
  );

  for (const [reviewId, likeCount] of reviewLikeCounts) {
    await prisma.review.update({
      where: { id: reviewId },
      data: { likeCount },
    });
  }

  if (options.withActivities) {
    const reviewActivities = createdReviews
      .filter((review) => review.bookId)
      .map((review) => ({
        userId: review.userId,
        bookId: review.bookId!,
        reviewId: review.id,
        action: "rated",
        reviewRating: review.rating,
        date: new Date(),
      }));

    await chunkedCreateMany("Book review activities", reviewActivities, (chunk) =>
      prisma.activity.createMany({ data: chunk }),
    );
  }

  for (const [bookId, aggregate] of bookAggregates) {
    await prisma.book.update({
      where: { id: bookId },
      data: {
        avgRating: aggregate.sum / aggregate.count,
        numRatings: aggregate.count,
      },
    });
  }

  console.log(
    `Done: ${allReviews.length.toLocaleString()} book reviews and ${reviewLikes.length.toLocaleString()} likes created.`,
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
