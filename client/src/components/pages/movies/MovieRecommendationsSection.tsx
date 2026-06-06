import { useEffect, useRef, useState } from "react";

import { MovieRecommendationsData } from "../../../lib/entities";
import { MovieCard } from "./MovieCard";
import { ArrowIcon } from "../../icons/ArrowIcon";

interface MovieRecommendationsSectionProps {
    movieRecommendationsData: MovieRecommendationsData;
}

export const MovieRecommendationsSection = ({
    movieRecommendationsData,
}: MovieRecommendationsSectionProps) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const {
        recommendations,
        recommendationsAvailable,
        currentReviewCount,
        minReviewsRequired,
    } = movieRecommendationsData;
    const reviewsRemaining = Math.max(
        minReviewsRequired - currentReviewCount,
        0,
    );

    const handleScroll = (direction: "left" | "right") => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const scrollAmount = scrollContainer.clientWidth * 0.8;
        scrollContainer.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const updateScrollState = () => {
            const maxScrollLeft =
                scrollContainer.scrollWidth - scrollContainer.clientWidth;

            setCanScrollLeft(scrollContainer.scrollLeft > 0);
            setCanScrollRight(scrollContainer.scrollLeft < maxScrollLeft - 1);
        };

        updateScrollState();
        scrollContainer.addEventListener("scroll", updateScrollState);
        window.addEventListener("resize", updateScrollState);

        return () => {
            scrollContainer.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
        };
    }, [recommendations.length]);

    return (
        <section className="flex flex-col gap-8 w-full rounded-xl bg-fuchsia-100 p-4 sm:p-6">
            <h2 className="text-xl text-center text-fuchsia-950 font-bold">
                Recommended for you
            </h2>
            {!recommendationsAvailable ? (
                <div className="rounded-lg border border-dashed border-sky-700 bg-white/70 p-4 text-center text-sky-950">
                    <p className="font-semibold">
                        Review {reviewsRemaining} more{" "}
                        {reviewsRemaining === 1 ? "movie" : "movies"} to unlock
                        movie recommendations.
                    </p>
                    <p className="mt-1 text-sm">
                        Movie suggestions appear once you have reviewed at least{" "}
                        {minReviewsRequired} movies.
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
                                    key={recommendation.movie.id}
                                    className="flex shrink-0 flex-col items-center gap-3"
                                >
                                    <MovieCard
                                        movieId={recommendation.movie.id}
                                        title={recommendation.movie.title}
                                        releaseYear={
                                            recommendation.movie.releaseYear
                                        }
                                        genres={recommendation.movie.genres}
                                        avgRating={
                                            recommendation.movie.avgRating
                                        }
                                        numRatings={
                                            recommendation.movie.numRatings
                                        }
                                        poster={recommendation.movie.poster}
                                        hasShadow={false}
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
                    No movie recommendations are available yet.
                </p>
            )}
        </section>
    );
};
