import { BookRecommendationsData } from "../../../lib/entities";
import { ArrowIcon } from "../../icons/ArrowIcon";
import { useHorizontalScroll } from "../../../hooks/useHorizontalScroll";
import { BookCard } from "./BookCard";

interface BookRecommendationsSectionProps {
    bookRecommendationsData: BookRecommendationsData;
}

export const BookRecommendationsSection = ({
    bookRecommendationsData,
}: BookRecommendationsSectionProps) => {
    const {
        recommendations,
        recommendationsAvailable,
        currentReviewCount,
        minReviewsRequired,
    } = bookRecommendationsData;
    const reviewsRemaining = Math.max(
        minReviewsRequired - currentReviewCount,
        0,
    );
    const { scrollContainerRef, canScrollLeft, canScrollRight, handleScroll } =
        useHorizontalScroll(recommendations.length);

    return (
        <section className="flex flex-col gap-8 w-full rounded-xl bg-fuchsia-100 p-4 sm:p-6">
            <h2 className="text-xl text-center text-fuchsia-950 font-bold">
                Recommended for you
            </h2>
            {!recommendationsAvailable ? (
                <div className="rounded-lg border border-dashed border-sky-700 bg-white/70 p-4 text-center text-sky-950">
                    <p className="font-semibold">
                        Review {reviewsRemaining} more{" "}
                        {reviewsRemaining === 1 ? "book" : "books"} to unlock
                        book recommendations.
                    </p>
                    <p className="mt-1 text-sm">
                        Book suggestions appear once you have reviewed at least{" "}
                        {minReviewsRequired} books.
                    </p>
                </div>
            ) : recommendations.length > 0 ? (
                <div className="flex items-center gap-4">
                    <ArrowIcon
                        direction="left"
                        onClick={() => handleScroll("left")}
                        disabled={!canScrollLeft}
                    />
                    <div
                        ref={scrollContainerRef}
                        className="w-full overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="flex w-max gap-8 pr-4">
                            {recommendations.map((recommendation) => (
                                <div
                                    key={recommendation.book.id}
                                    className="flex shrink-0 flex-col items-center gap-3"
                                >
                                    <BookCard
                                        bookId={recommendation.book.id}
                                        title={recommendation.book.title}
                                        releaseYear={
                                            recommendation.book.releaseYear
                                        }
                                        authors={recommendation.book.authors}
                                        genres={recommendation.book.genres}
                                        avgRating={
                                            recommendation.book.avgRating
                                        }
                                        numRatings={
                                            recommendation.book.numRatings
                                        }
                                        poster={recommendation.book.poster}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <ArrowIcon
                        direction="right"
                        onClick={() => handleScroll("right")}
                        disabled={!canScrollRight}
                    />
                </div>
            ) : (
                <p className="text-center">
                    No book recommendations are available yet.
                </p>
            )}
        </section>
    );
};
