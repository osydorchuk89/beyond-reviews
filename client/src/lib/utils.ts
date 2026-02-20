export const getMoviePoster = (poster: string) => {
    return poster.endsWith("null") || poster === ""
        ? "/images/fallback-movie-poster.jpg"
        : poster;
};
