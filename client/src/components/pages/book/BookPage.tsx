import { useLoaderData, useRouteLoaderData } from "react-router";

import type { AuthData, Book, BookReviewsData } from "../../../lib/entities";
import { useWishlistState } from "../../../hooks/useWishlistState";
import { getWishlistKey } from "../../../store";
import { ActionFeedback } from "../../ui/ActionFeedback";
import { ButtonLink } from "../../ui/ButtonLink";
import { horizontalPadding } from "../../../styles/responsive";
import { BookMainInfo } from "./BookMainInfo";
import { BookAdditionalInfo } from "./BookAdditionalInfo";
import { BookReviews } from "./BookReviews";

export const BookPage = () => {
    const { authData } = useRouteLoaderData("root") as { authData: AuthData };
    const { book, bookReviewsData } = useLoaderData() as {
        book: Book;
        bookReviewsData: BookReviewsData;
    };
    const wishlistKey = book
        ? getWishlistKey("Book", book.id, authData.user?.id)
        : null;
    const wishlist = useWishlistState(
        wishlistKey,
        (book?.onWishlist ?? []).some(
            (entry) => entry.userId === authData.user?.id,
        ),
    );

    if (!book) {
        return (
            <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
                <article className="flex flex-col gap-4 text-center text-xl">
                    <h1 tabIndex={-1}>Book not found</h1>
                    <p>The page for this book does not exist</p>
                </article>
                <ButtonLink to="/books" style="orange">
                    BACK TO ALL BOOKS
                </ButtonLink>
            </div>
        );
    }

    return (
        <div
            key={wishlistKey}
            className={`flex flex-col w-full mx-auto ${horizontalPadding.page} text-sky-950 relative`}
        >
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-6 sm:py-10">
                <BookMainInfo book={book} />
                <BookAdditionalInfo
                    key={book.id}
                    book={book}
                    userReview={bookReviewsData.userReview}
                />
            </div>
            <BookReviews
                bookId={book.id}
                initialBookReviewsData={bookReviewsData}
            />
            <ActionFeedback
                status={wishlist?.status ?? ""}
                error={wishlist?.error ?? ""}
            />
        </div>
    );
};
