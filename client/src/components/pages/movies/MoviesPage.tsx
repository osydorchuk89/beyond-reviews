import { useLoaderData, useSearchParams } from "react-router";

import { MoviesList } from "./MoviesList";
import { SearchBar } from "./SearchBar";
import { MoviesData } from "../../../lib/entities";
import { SortFilterBar } from "./SortFilterBar";
import { sideBarFilterList, sideBarSortList } from "../../../lib/data";

export const MoviesPage = () => {
    const { moviesData } = useLoaderData() as {
        moviesData: MoviesData;
    };

    const [searchParams] = useSearchParams();

    const genre = searchParams.get("genre");
    const releaseYear = searchParams.get("releaseYear");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const search = searchParams.get("search");

    const filters = [];

    if (moviesData.appliedFilters.genre) {
        filters.push(`Genre: ${moviesData.appliedFilters.genre}`);
    }
    if (moviesData.appliedFilters.releaseYear) {
        filters.push(`Year: ${moviesData.appliedFilters.releaseYear}`);
    }
    if (moviesData.appliedFilters.director) {
        filters.push(`Director: ${moviesData.appliedFilters.director}`); // Add director to subtitle
    }
    if (moviesData.appliedFilters.search) {
        filters.push(`Search: "${moviesData.appliedFilters.search}"`);
    }

    return (
        <div className="flex flex-col w-full">
            <p className="text-4xl text-center font-bold py-10 mb-5">
                Popular Movies
            </p>
            <div className="flex flex-col md:flex-row items-center md:items-start">
                <div className="flex flex-col w-5/6 md:w-1/4 ml-5 gap-8 mb-5">
                    <SearchBar />
                    <SortFilterBar
                        itemsList={sideBarSortList}
                        title="Sort by:"
                    />
                    <SortFilterBar
                        itemsList={sideBarFilterList}
                        title="Filter:"
                    />
                </div>
                <div className="flex flex-col w-full md:w-3/4">
                    <MoviesList
                        movies={moviesData.movies}
                        filters={filters}
                        hasMore={moviesData.hasMore}
                        currentPage={moviesData.currentPage}
                        genre={genre}
                        releaseYear={releaseYear}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        search={search}
                    />
                </div>
            </div>
        </div>
    );
};
