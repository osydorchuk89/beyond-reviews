import { Book } from "../../../lib/entities";
import { BookCard } from "./BookCard";

interface BooksListProps {
    allBooks: Book[];
}

export const BooksList = ({ allBooks }: BooksListProps) => {
    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-center justify-items-center lg:justify-items-end w-full gap-16">
            {allBooks.map((book: Book) => (
                <BookCard
                    key={book.id}
                    bookId={book.id}
                    title={book.title}
                    releaseYear={book.releaseYear}
                    authors={book.authors}
                    genres={book.genres}
                    avgRating={book.avgRating}
                    numRatings={book.numRatings}
                    poster={book.poster}
                />
            ))}
        </ul>
    );
};
