import { Book } from "../../../lib/entities";
import { StarIcon } from "../../icons/StarIcon";
import { QueryLink } from "../../ui/QueryLink";
import { useFilterNavigation } from "../../../hooks/useFilterNavigation";

interface BookDetailsProps {
    book: Book;
}

export const BookDetails = ({ book }: BookDetailsProps) => {
    const handleFilterNavigation = useFilterNavigation("/books");

    return (
        <div className="flex flex-col gap-5 text-lg mb-5 relative">
            <div>
                <span className="font-semibold">Author: </span>
                {book.authors.length > 0 ? (
                    book.authors.map((author, index) => (
                        <span key={author}>
                            <QueryLink
                                isBold
                                onClick={() =>
                                    handleFilterNavigation("author", author)
                                }
                            >
                                {author}
                            </QueryLink>
                            {index !== book.authors.length - 1 && ", "}
                        </span>
                    ))
                ) : (
                    <span>Unknown author</span>
                )}
            </div>
            <div>
                {book.genres.map((item, index) => (
                    <span key={item}>
                        <QueryLink
                            key={item}
                            onClick={() =>
                                handleFilterNavigation("genre", item)
                            }
                        >
                            {item}
                        </QueryLink>
                        {index !== book.genres.length - 1 && " | "}
                    </span>
                ))}
            </div>
            <div className="flex flex-wrap gap-5 text-gray-600">
                {book.pageCount && <span>{book.pageCount} pages</span>}
                <span className="flex">
                    <StarIcon className="w-6 h-6 fill-sky-500 border-none" />{" "}
                    {book.avgRating.toPrecision(2)}
                </span>
                <span>
                    {book.numRatings}{" "}
                    {book.numRatings === 1 ? "review" : "reviews"}
                </span>
                {book.isbn13 && <span>ISBN-13: {book.isbn13}</span>}
            </div>
            {book.overview ? (
                <p>{book.overview}</p>
            ) : (
                <p className="italic">No overview available.</p>
            )}
        </div>
    );
};
