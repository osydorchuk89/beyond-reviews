import type { Movie } from "../../../lib/entities";
import { getMovies } from "../../../lib/api";
import { MediaListSection } from "../media/MediaListSection";
import { MoviesList } from "./MoviesList";

interface MoviesListSectionProps {
    movies: Movie[];
    filters: string[];
    hasMore: boolean;
    currentPage: number;
}

export const MoviesListSection = ({
    movies,
    filters,
    hasMore,
    currentPage,
}: MoviesListSectionProps) => {
    return (
        <MediaListSection
            items={movies}
            filters={filters}
            hasMore={hasMore}
            currentPage={currentPage}
            emptyMessage="No movies found"
            filterParamByLabel={{
                "Genre:": "genre",
                "Year:": "releaseYear",
                "Director:": "director",
                "Actor:": "actor",
                "Search:": "search",
            }}
            loadMoreItems={async (nextPage, searchParams) => {
                const moviesData = await getMovies(
                    nextPage,
                    15,
                    searchParams.get("genre") ?? undefined,
                    searchParams.get("releaseYear") ?? undefined,
                    searchParams.get("director") ?? undefined,
                    searchParams.get("actor") ?? undefined,
                    searchParams.get("sortBy") ?? undefined,
                    searchParams.get("sortOrder") ?? undefined,
                    searchParams.get("search") ?? undefined,
                );
                return {
                    items: moviesData.movies,
                    hasMore: moviesData.hasMore,
                };
            }}
            renderItems={(allMovies) => <MoviesList allMovies={allMovies} />}
            fetchErrorMessage="Failed to load more movies:"
        />
    );
};
