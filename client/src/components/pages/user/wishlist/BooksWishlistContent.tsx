import { Suspense } from "react";
import { Await } from "react-router";

import type {
    BookRecommendationsData,
    WishlistData,
} from "../../../../lib/entities";
import { BookRecommendationsLoadingSection } from "../../books/BookRecommendationsLoadingSection";
import { BookRecommendationsSection } from "../../books/BookRecommendationsSection";
import { BookCard } from "../../books/BookCard";
import { WishlistEmptyState } from "./WishlistEmptyState";

interface BooksWishlistContentProps {
    wishlistData: WishlistData;
    bookRecommendationsDataPromise: Promise<BookRecommendationsData | null> | null;
    isSameUser: boolean;
    profileUserName: string;
}

export const BooksWishlistContent = ({
    wishlistData,
    bookRecommendationsDataPromise,
    isSameUser,
    profileUserName,
}: BooksWishlistContentProps) => (
    <>
        {wishlistData.books.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-center justify-items-center gap-8 sm:gap-12 lg:gap-16 w-full">
                {wishlistData.books.map((item) => (
                    <BookCard
                        bookId={item.bookId}
                        key={item.bookId}
                        title={item.book.title}
                        releaseYear={item.book.releaseYear}
                        authors={item.book.authors}
                        genres={item.book.genres}
                        avgRating={item.book.avgRating}
                        numRatings={item.book.numRatings}
                        poster={item.book.poster}
                    />
                ))}
            </div>
        ) : (
            <WishlistEmptyState
                isSameUser={isSameUser}
                profileUserName={profileUserName}
                mediaLabel="books"
                exploreTo="/books"
                exploreLabel="EXPLORE BOOKS"
            />
        )}

        {bookRecommendationsDataPromise && (
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
        )}
    </>
);
