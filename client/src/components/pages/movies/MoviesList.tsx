import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { MovieCard } from "./MovieCard";
import { Movie } from "../../../lib/entities";
import { BaseButton } from "../../ui/BaseButton";
import { getMovies } from "../../../lib/actions";
import { FilterTags } from "./FilterTags";

interface MoviesListProps {
    movies: Movie[];
    filters?: string[];
    hasMore: boolean;
    currentPage: number;
    genre?: string | null;
    releaseYear?: string | null;
    director?: string | null;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
}

export const MoviesList = ({
    movies,
    filters,
    hasMore,
    currentPage,
    genre,
    releaseYear,
    director,
    sortBy,
    sortOrder,
    search,
}: MoviesListProps) => {
    const [_, setSearchParams] = useSearchParams();
    const [allMovies, setAllMovies] = useState<Movie[]>(movies);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(currentPage);
    const [hasMoreMovies, setHasMoreMovies] = useState(hasMore);

    const handleLoadMore = async () => {
        setLoading(true);
        try {
            const nextPage = page + 1;
            const moviesData = await getMovies(
                nextPage,
                15,
                genre || undefined,
                releaseYear || undefined,
                director || undefined,
                sortBy || undefined,
                sortOrder || undefined,
                search || undefined
            );
            setAllMovies((prev) => [...prev, ...moviesData.movies]);
            setPage(nextPage);
            setHasMoreMovies(moviesData.hasMore);
        } catch (error) {
            console.error("Failed to load more movies:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setAllMovies(movies);
        setPage(currentPage);
        setHasMoreMovies(hasMore);
    }, [movies, currentPage, hasMore]);

    const handleCloseFilterTag = (filter: string) => {
        setSearchParams((searchParams) => {
            if (filter.includes("Genre:")) {
                searchParams.delete("genre");
            }
            if (filter.includes("Year:")) {
                searchParams.delete("releaseYear");
            }
            if (filter.includes("Director:")) {
                searchParams.delete("director");
            }
            if (filter.includes("Search:")) {
                searchParams.delete("search");
            }
            searchParams.delete("page");
            return searchParams;
        });
    };

    return (
        <div className="flex flex-col w-full">
            {filters && filters.length > 0 && (
                <FilterTags
                    filters={filters}
                    onRemoveFilter={handleCloseFilterTag}
                />
            )}
            <div className="flex flex-col gap-10 mb-10 items-center">
                {allMovies.length > 0 ? (
                    <>
                        <ul className="grid grid-cols-1 lg:grid-cols-3 items-center gap-16 mx-5">
                            {allMovies.map((movie: Movie) => (
                                <MovieCard
                                    key={movie.id}
                                    id={movie.id}
                                    title={movie.title}
                                    releaseYear={movie.releaseYear}
                                    genres={movie.genres}
                                    avgRating={movie.avgRating}
                                    numRatings={movie.numRatings}
                                    poster={movie.poster}
                                />
                            ))}
                        </ul>
                        {hasMoreMovies && (
                            <div className="flex justify-center mb-10">
                                <BaseButton
                                    text={loading ? "LOADING..." : "LOAD MORE"}
                                    style="sky"
                                    handleClick={handleLoadMore}
                                    disabled={loading}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex justify-center items-start mt-20 h-[50vh]">
                        <p className="text-2xl">No movies found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
