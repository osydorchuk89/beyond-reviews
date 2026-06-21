export const movieSelect = {
  id: true,
  title: true,
  releaseYear: true,
  overview: true,
  language: true,
  genres: true,
  keywords: true,
  popularity: true,
  avgRating: true,
  numRatings: true,
  image: true,
  tmdbId: true,
  director: true,
  cast: true,
  runtime: true,
} as const;

export const toMovieResponse = <
  T extends {
    image: string;
    tmdbId?: number | null;
    director?: string | null;
    cast?: string[] | null;
    runtime?: number | null;
  },
>(
  movie: T,
) => {
  const { image, ...rest } = movie;

  return {
    ...rest,
    poster: image,
  };
};

export const toMovieReviewResponse = <T extends { movieId: string | null }>(
  review: T,
) => {
  const { movieId, ...rest } = review;

  return {
    ...rest,
    movieId,
  };
};

export const toMovieWatchlistResponse = <
  T extends { movieId: string | null; movie: { image: string } | null },
>(
  item: T,
) => {
  const { movieId, movie, ...rest } = item;

  return {
    ...rest,
    movieId,
    movie: movie ? toMovieResponse(movie) : movie,
  };
};

export const fromMovieWriteData = (data: Record<string, unknown>) => {
  const { poster, ...rest } = data;

  return {
    ...rest,
    ...(typeof poster === "string" ? { image: poster } : {}),
  };
};
