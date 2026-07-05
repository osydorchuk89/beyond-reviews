import { Suspense } from "react";
import { Await, useLoaderData } from "react-router";

import { BookRecommendationsData, BooksData } from "../../../lib/entities";
import {
    booksSideBarFilterList,
    booksSideBarSortList,
} from "../../../lib/data";
import { horizontalPadding } from "../../../styles/responsive";
import { MediaCatalogPage } from "../media/MediaCatalogPage";
import { BookRecommendationsLoadingSection } from "./BookRecommendationsLoadingSection";
import { BookRecommendationsSection } from "./BookRecommendationsSection";
import { BooksListSection } from "./BooksListSection";

export const BooksPage = () => {
    const { booksDataPromise, bookRecommendationsDataPromise } =
        useLoaderData() as {
            booksDataPromise: Promise<BooksData>;
            bookRecommendationsDataPromise: Promise<BookRecommendationsData | null>;
        };

    const buildFilters = (appliedFilters: BooksData["appliedFilters"]) => {
        const filters = [];

        if (appliedFilters.genre) {
            filters.push(`Genre: ${appliedFilters.genre}`);
        }
        if (appliedFilters.releaseYear) {
            filters.push(`Year: ${appliedFilters.releaseYear}`);
        }
        if (appliedFilters.author) {
            filters.push(`Author: ${appliedFilters.author}`);
        }
        if (appliedFilters.search) {
            filters.push(`Search: "${appliedFilters.search}"`);
        }

        return filters;
    };

    return (
        <MediaCatalogPage
            title="Popular Books"
            dataPromise={booksDataPromise}
            searchPlaceholder="enter book title"
            sortItems={booksSideBarSortList}
            filterItems={booksSideBarFilterList}
            renderContent={(booksData) => {
                const filters = buildFilters(booksData.appliedFilters);
                return (
                    <BooksListSection
                        books={booksData.books}
                        filters={filters}
                        hasMore={booksData.hasMore}
                        currentPage={booksData.currentPage}
                    />
                );
            }}
        >
            <div className={`w-full ${horizontalPadding.page}`}>
                <Suspense fallback={<BookRecommendationsLoadingSection />}>
                    <Await resolve={bookRecommendationsDataPromise}>
                        {(bookRecommendationsData) =>
                            bookRecommendationsData ? (
                                <BookRecommendationsSection
                                    bookRecommendationsData={
                                        bookRecommendationsData
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
