import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";

import { MoviesListSection } from "./MoviesListSection";
import { SearchBar } from "./SearchBar";
import { MoviesData } from "../../../lib/entities";
import { SortFilterBar } from "./SortFilterBar";
import { sideBarFilterList, sideBarSortList } from "../../../lib/data";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { horizontalPadding } from "../../../styles/responsive";

export const MoviesPage = () => {
    const { moviesDataPromise } = useLoaderData() as {
        moviesDataPromise: Promise<MoviesData>;
    };

    const buildFilters = (appliedFilters: MoviesData["appliedFilters"]) => {
        const filters = [];

        if (appliedFilters.genre) {
            filters.push(`Genre: ${appliedFilters.genre}`);
        }
        if (appliedFilters.releaseYear) {
            filters.push(`Year: ${appliedFilters.releaseYear}`);
        }
        if (appliedFilters.director) {
            filters.push(`Director: ${appliedFilters.director}`);
        }
        if (appliedFilters.search) {
            filters.push(`Search: "${appliedFilters.search}"`);
        }

        return filters;
    };

    return (
        <div className="flex flex-col w-full">
            <p className="text-4xl text-center font-bold py-10 mb-5">
                Popular Movies
            </p>
            <div
                className={`flex flex-col lg:flex-row items-center gap-8 lg:items-start ${horizontalPadding.page}`}
            >
                <aside className="flex flex-col w-5/6 lg:w-1/4 gap-8 mb-5">
                    <SearchBar />
                    <SortFilterBar
                        itemsList={sideBarSortList}
                        title="Sort by:"
                    />
                    <SortFilterBar
                        itemsList={sideBarFilterList}
                        title="Filter:"
                    />
                </aside>
                <div className="flex flex-col w-full md:w-3/4">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Await resolve={moviesDataPromise}>
                            {(moviesData) => {
                                const filters = buildFilters(
                                    moviesData.appliedFilters,
                                );
                                return (
                                    <MoviesListSection
                                        movies={moviesData.movies}
                                        filters={filters}
                                        hasMore={moviesData.hasMore}
                                        currentPage={moviesData.currentPage}
                                    />
                                );
                            }}
                        </Await>
                    </Suspense>
                </div>
            </div>
        </div>
    );
};
