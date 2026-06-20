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
  movie: true,
} as const;

export const toMovieResponse = <
  T extends {
    image: string;
    movie?: {
      tmdbId?: number | null;
      director?: string;
      cast?: string[];
      runtime?: number;
    } | null;
  },
>(
  mediaItem: T,
) => {
  const { image, movie, ...rest } = mediaItem;

  return {
    ...rest,
    tmdbId: movie?.tmdbId ?? null,
    director: movie?.director ?? "",
    cast: movie?.cast ?? [],
    runtime: movie?.runtime ?? 0,
    poster: image,
  };
};

export const toMovieReviewResponse = <T extends { mediaItemId: string }>(
  review: T,
) => {
  const { mediaItemId, ...rest } = review;

  return {
    ...rest,
    movieId: mediaItemId,
  };
};

export const toMovieWatchlistResponse = <
  T extends { mediaItemId: string; mediaItem: { image: string; movie?: {} | null } },
>(
  item: T,
) => {
  const { mediaItemId, mediaItem, ...rest } = item;

  return {
    ...rest,
    movieId: mediaItemId,
    movie: toMovieResponse(mediaItem),
  };
};

export const fromMovieWriteData = (data: Record<string, unknown>) => {
  const { poster, tmdbId, director, cast, runtime, ...rest } = data;

  return {
    mediaItem: {
      ...rest,
      ...(typeof poster === "string" ? { image: poster } : {}),
    },
    movie: {
      ...(typeof tmdbId === "number" ? { tmdbId } : {}),
      ...(typeof director === "string" ? { director } : {}),
      ...(Array.isArray(cast) ? { cast } : {}),
      ...(typeof runtime === "number" ? { runtime } : {}),
    },
  };
};
