import { useRouteLoaderData } from "react-router";

import { AuthData, Book } from "../../../lib/entities";
import { QueryLink } from "../../ui/QueryLink";
import { useFilterNavigation } from "../../../hooks/useFilterNavigation";
import { BookBookmark } from "./BookBookmark";

interface BookMainInfoProps {
    book: Book;
}

export const BookMainInfo = ({ book }: BookMainInfoProps) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const handleFilterNavigation = useFilterNavigation("/books");

    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-0 md:gap-6 w-full lg:w-1/3 relative">
            {authData.user && (
                <div className="block md:hidden">
                    <BookBookmark book={book} authData={authData} />
                </div>
            )}
            <p className="mb-3 md:mb-0 text-2xl sm:text-3xl md:text-4xl text-center font-semibold">
                {book.title}
            </p>
            <p className="text-lg text-center font-semibold">
                {book.authors.join(", ") || "Unknown author"}
            </p>
            <p className="text-xl font-semibold">
                <QueryLink
                    onClick={() =>
                        handleFilterNavigation(
                            "releaseYear",
                            book.releaseYear.toString(),
                        )
                    }
                >
                    {book.releaseYear}
                </QueryLink>
            </p>
            <img
                className="w-full max-w-80 rounded-lg"
                src={book.poster}
                alt={`${book.title} cover`}
            />
        </div>
    );
};
