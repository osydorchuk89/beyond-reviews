import { useEffect, useRef, useState } from "react";

import {
    MediaReviewCard,
    MediaReviewCardData,
} from "./MediaReviewCard";
import { Pagination } from "../../ui/Pagination";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

interface MediaReviewsData<TReview extends MediaReviewCardData> {
    reviews: TReview[];
    currentPage: number;
    totalPages: number;
    userReview?: TReview | null;
}

interface MediaReviewsProps<
    TReview extends MediaReviewCardData,
    TReviewsData extends MediaReviewsData<TReview>,
> {
    mediaId: string;
    initialReviewsData: TReviewsData;
    getReviews: (
        mediaId: string,
        page: number,
        limit: number,
    ) => Promise<TReviewsData>;
    likeOrUnlikeReview: (
        mediaId: string,
        reviewId: string,
        userId: string,
        hasLiked: boolean,
    ) => Promise<void>;
    emptyMessage?: string;
    fetchErrorMessage?: string;
}

const REVIEWS_PER_PAGE = 10;
const SCROLL_OFFSET = 80;

export const MediaReviews = <
    TReview extends MediaReviewCardData,
    TReviewsData extends MediaReviewsData<TReview>,
>({
    mediaId,
    initialReviewsData,
    getReviews,
    likeOrUnlikeReview,
    emptyMessage = "No reviews yet",
    fetchErrorMessage = "Failed to fetch reviews:",
}: MediaReviewsProps<TReview, TReviewsData>) => {
    const [reviewsData, setReviewsData] = useState(initialReviewsData);
    const [isLoading, setIsLoading] = useState(false);
    const reviewsRef = useRef<HTMLDivElement>(null);
    const { reviews, currentPage, totalPages } = reviewsData;

    useEffect(() => {
        setReviewsData(initialReviewsData);
    }, [initialReviewsData]);

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
            const data = await getReviews(mediaId, page, REVIEWS_PER_PAGE);
            setReviewsData((prevData) => ({
                ...data,
                userReview: data.userReview ?? prevData.userReview,
            }));
            scrollToReviews();
        } catch (error) {
            console.error(fetchErrorMessage, error);
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
                                <MediaReviewCard
                                    key={review.id}
                                    review={review}
                                    mediaId={mediaId}
                                    likeOrUnlikeReview={likeOrUnlikeReview}
                                />
                            ))}
                        {reviews.length === 0 && (
                            <div className="flex justify-center italic">
                                {emptyMessage}
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
