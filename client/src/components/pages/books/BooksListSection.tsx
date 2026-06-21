import { Book } from "../../../lib/entities";
import { getBooks } from "../../../lib/api";
import { MediaListSection } from "../media/MediaListSection";
import { BooksList } from "./BooksList";

interface BooksListSectionProps {
    books: Book[];
    filters: string[];
    hasMore: boolean;
    currentPage: number;
}

export const BooksListSection = ({
    books,
    filters,
    hasMore,
    currentPage,
}: BooksListSectionProps) => {
    return (
        <MediaListSection
            items={books}
            filters={filters}
            hasMore={hasMore}
            currentPage={currentPage}
            emptyMessage="No books found"
            filterParamByLabel={{
                "Genre:": "genre",
                "Year:": "releaseYear",
                "Author:": "author",
                "Search:": "search",
            }}
            loadMoreItems={async (nextPage, searchParams) => {
                const booksData = await getBooks(
                    nextPage,
                    15,
                    searchParams.get("genre") ?? undefined,
                    searchParams.get("releaseYear") ?? undefined,
                    searchParams.get("author") ?? undefined,
                    searchParams.get("sortBy") ?? undefined,
                    searchParams.get("sortOrder") ?? undefined,
                    searchParams.get("search") ?? undefined,
                );
                return {
                    items: booksData.books,
                    hasMore: booksData.hasMore,
                };
            }}
            renderItems={(allBooks) => <BooksList allBooks={allBooks} />}
            fetchErrorMessage="Failed to load more books:"
        />
    );
};
