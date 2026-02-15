export const getMoviePoster = (poster: string) => {
    return poster.endsWith("null")
        ? "/images/fallback-movie-poster.jpg"
        : poster;
};
