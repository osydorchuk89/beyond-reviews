import { useEffect, useRef, useState } from "react";

import { MovieReviewsData } from "../../../lib/entities";
import { getMovieReviews } from "../../../lib/api";
import { Pagination } from "../../ui/Pagination";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { MovieReviewCard } from "./MovieReviewCard";

interface MovieReviewsProps {
    movieId: string;
    initialMovieReviewsData: MovieReviewsData;
}

const REVIEWS_PER_PAGE = 10;
const SCROLL_OFFSET = 80;

export const MovieReviews = ({
    movieId,
    initialMovieReviewsData,
}: MovieReviewsProps) => {
    const [movieReviewsData, setMovieReviewsData] = useState(
        initialMovieReviewsData,
    );
    const [isLoading, setIsLoading] = useState(false);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const { reviews, currentPage, totalPages } = movieReviewsData;

    useEffect(() => {
        setMovieReviewsData(initialMovieReviewsData);
    }, [initialMovieReviewsData]);

    const scrollToReviews = () => {
        if (reviewsRef.current) {
            const top =
                reviewsRef.current.getBoundingClientRect().top +
                window.scrollY -
                SCROLL_OFFSET;
            window.scrollTo({ top, behavior: "smooth" });
        }
    };

    const handlePageChange = async (page: number) => {
        setIsLoading(true);
        try {
            const data = await getMovieReviews(
                movieId,
                page,
                REVIEWS_PER_PAGE,
            );
            setMovieReviewsData((prevData) => ({
                ...data,
                userReview: data.userReview ?? prevData.userReview,
            }));
            scrollToReviews();
        } catch (error) {
            console.error("Failed to fetch movie reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={reviewsRef}>
            <hr className="h-px mb-5 bg-sky-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {isLoading ? (
                    <LoadingSpinner />
                ) : (
                    <>
                        {reviews.length > 0 &&
                            reviews.map((review) => (
                                <MovieReviewCard
                                    key={review.id}
                                    movieReview={review}
                                />
                            ))}
                        {reviews.length === 0 && (
                            <div className="flex justify-center italic">
                                No reviews yet
                            </div>
                        )}
                    </>
                )}
            </div>
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};
