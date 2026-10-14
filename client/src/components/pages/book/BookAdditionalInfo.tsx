import { useRouteLoaderData } from "react-router";

import type { AuthData, Book, BookReview } from "../../../lib/entities";
import { BookBookmark } from "./BookBookmark";
import { BookDetails } from "./BookDetails";
import { BookReviewSection } from "./BookReviewSection";

interface BookAdditionalInfoProps {
    book: Book;
    userReview?: BookReview | null;
}

export const BookAdditionalInfo = ({
    book,
    userReview,
}: BookAdditionalInfoProps) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };

    return (
        <div className="flex flex-col w-full lg:w-2/3 text-base md:text-lg relative">
            <div className="hidden md:block">
                {authData.user && (
                    <BookBookmark book={book} authData={authData} />
                )}
            </div>
            <BookDetails book={book} />
            <BookReviewSection userReview={userReview} authData={authData} />
        </div>
    );
};
