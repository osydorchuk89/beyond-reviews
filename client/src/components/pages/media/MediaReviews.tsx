import { useEffect, useRef, useState } from "react";

import { MediaReviewCard, type MediaReviewCardData } from "./MediaReviewCard";
import { Pagination } from "../../ui/Pagination";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { ActionFeedback } from "../../ui/ActionFeedback";

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
    const pending = useRef(false);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const { reviews, currentPage, totalPages } = reviewsData;

    useEffect(() => {
        setReviewsData(initialReviewsData);
    }, [initialReviewsData]);

    const handlePageChange = async (page: number) => {
        if (pending.current) return;
        pending.current = true;
        setIsLoading(true);
        setStatus(`Loading reviews, page ${page}…`);
        setError("");
        try {
            const data = await getReviews(mediaId, page, REVIEWS_PER_PAGE);
            setReviewsData((prevData) => ({
                ...data,
                userReview: data.userReview ?? prevData.userReview,
            }));
            setStatus(
                `Reviews loaded. Page ${data.currentPage}. ${data.reviews.length} reviews shown.`,
            );
        } catch (error) {
            console.error(fetchErrorMessage, error);
            setStatus("");
            setError("Could not load reviews. Try again.");
        } finally {
            pending.current = false;
            setIsLoading(false);
        }
    };

    return (
        <div>
            <hr className="h-px mb-5 bg-sky-400 border-0" />
            <h2 className="text-center text-xl font-bold">User Reviews</h2>
            <div aria-busy={isLoading} className="flex flex-col my-5 gap-5">
                {isLoading ? (
                    <LoadingSpinner announce={false} />
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
                    isLoading={isLoading}
                />
            )}
            <ActionFeedback status={status} error={error} />
        </div>
    );
};
