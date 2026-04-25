import { useEffect, useRef, useState } from "react";

import { MovieReview } from "../../../lib/entities";
import { Pagination } from "../../ui/Pagination";
import { MovieReviewCard } from "./MovieReviewCard";

interface MovieReviewsProps {
    movieReviews: MovieReview[];
}

const REVIEWS_PER_PAGE = 10;
const SCROLL_OFFSET = 80;

export const MovieReviews = ({ movieReviews }: MovieReviewsProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const totalPages = Math.ceil(movieReviews.length / REVIEWS_PER_PAGE);
    const page = Math.min(currentPage, totalPages || 1);
    const firstReviewIndex = (page - 1) * REVIEWS_PER_PAGE;
    const paginatedReviews = movieReviews.slice(
        firstReviewIndex,
        firstReviewIndex + REVIEWS_PER_PAGE,
    );

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        if (reviewsRef.current) {
            const top =
                reviewsRef.current.getBoundingClientRect().top +
                window.scrollY -
                SCROLL_OFFSET;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    return (
        <div ref={reviewsRef}>
            <hr className="h-px mb-5 bg-sky-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {movieReviews.length > 0 &&
                    paginatedReviews.map((review) => (
                        <MovieReviewCard key={review.id} movieReview={review} />
                    ))}
                {movieReviews.length === 0 && (
                    <div className="flex justify-center italic">
                        No reviews yet
                    </div>
                )}
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};
