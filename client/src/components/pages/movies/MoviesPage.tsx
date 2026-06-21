import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";

import { MoviesListSection } from "./MoviesListSection";
import { MovieRecommendationsSection } from "./MovieRecommendationsSection";
import { MovieRecommendationsData, MoviesData } from "../../../lib/entities";
import { sideBarFilterList, sideBarSortList } from "../../../lib/data";
import { horizontalPadding } from "../../../styles/responsive";
import { MovieRecommendationsLoadingSection } from "./MovieRecommendationsLoadingSection";
import { MediaCatalogPage } from "../media/MediaCatalogPage";

export const MoviesPage = () => {
    const { moviesDataPromise, movieRecommendationsDataPromise } =
        useLoaderData() as {
            moviesDataPromise: Promise<MoviesData>;
            movieRecommendationsDataPromise: Promise<MovieRecommendationsData | null>;
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
        if (appliedFilters.actor) {
            filters.push(`Actor: ${appliedFilters.actor}`);
        }
        if (appliedFilters.search) {
            filters.push(`Search: "${appliedFilters.search}"`);
        }

        return filters;
    };

    return (
        <MediaCatalogPage
            title="Popular Movies"
            dataPromise={moviesDataPromise}
            sortItems={sideBarSortList}
            filterItems={sideBarFilterList}
            renderContent={(moviesData) => {
                const filters = buildFilters(moviesData.appliedFilters);
                return (
                    <MoviesListSection
                        movies={moviesData.movies}
                        filters={filters}
                        hasMore={moviesData.hasMore}
                        currentPage={moviesData.currentPage}
                    />
                );
            }}
        >
            <div className={`w-full ${horizontalPadding.page}`}>
                <Suspense fallback={<MovieRecommendationsLoadingSection />}>
                    <Await resolve={movieRecommendationsDataPromise}>
                        {(movieRecommendationsData) =>
                            movieRecommendationsData ? (
                                <MovieRecommendationsSection
                                    movieRecommendationsData={
                                        movieRecommendationsData
                                    }
                                />
                            ) : null
                        }
                    </Await>
                </Suspense>
            </div>
        </MediaCatalogPage>
    );
};
