import { useLoaderData } from "react-router";
import { ToastContainer } from "react-toastify";

import { Book, BookReviewsData } from "../../../lib/entities";
import { ButtonLink } from "../../ui/ButtonLink";
import { horizontalPadding } from "../../../styles/responsive";
import { BookMainInfo } from "./BookMainInfo";
import { BookAdditionalInfo } from "./BookAdditionalInfo";
import { BookReviews } from "./BookReviews";

export const BookPage = () => {
    const { book, bookReviewsData } = useLoaderData() as {
        book: Book;
        bookReviewsData: BookReviewsData;
    };

    if (!book) {
        return (
            <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
                <article className="flex flex-col gap-4 text-center text-xl">
                    <h2>Oops!</h2>
                    <h2>The page for this book does not exist</h2>
                </article>
                <ButtonLink to="/books" style="orange">
                    BACK TO ALL BOOKS
                </ButtonLink>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col w-full mx-auto ${horizontalPadding.page} text-sky-950 relative`}
        >
            <ToastContainer
                autoClose={3000}
                hideProgressBar
                toastStyle={{
                    backgroundColor: "#bae6fd",
                    paddingBlock: 0,
                    paddingInline: 20,
                }}
            />
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-6 sm:py-10">
                <BookMainInfo book={book} />
                <BookAdditionalInfo
                    book={book}
                    userReview={bookReviewsData.userReview}
                />
            </div>
            <BookReviews
                bookId={book.id}
                initialBookReviewsData={bookReviewsData}
            />
        </div>
    );
};
