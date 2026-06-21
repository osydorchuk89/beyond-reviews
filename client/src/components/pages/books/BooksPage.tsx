import { useLoaderData } from "react-router";

import { BooksData } from "../../../lib/entities";
import {
    booksSideBarFilterList,
    booksSideBarSortList,
} from "../../../lib/data";
import { MediaCatalogPage } from "../media/MediaCatalogPage";
import { BooksListSection } from "./BooksListSection";

export const BooksPage = () => {
    const { booksDataPromise } = useLoaderData() as {
        booksDataPromise: Promise<BooksData>;
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
        />
    );
};
