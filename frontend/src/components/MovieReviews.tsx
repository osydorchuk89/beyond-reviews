import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getMovieRatings } from "../lib/requests";
import { MovieRating, User } from "../lib/types";
import { ReviewCard } from "./ReviewCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { useAppSelector } from "../store/hooks";

export const MovieReviews = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { userData } = useAppSelector((state) => state.auth);
    const userId = userData?._id;
    const { data, isFetched } = useQuery({
        queryKey: ["movie", "ratings", { movieId: movieId }],
        queryFn: () => getMovieRatings(movieId),
    });

    const movieRatings = data as MovieRating[];

    return (
        <div>
            <hr className="h-px mb-5 bg-amber-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {isFetched &&
                    movieRatings.length > 0 &&
                    movieRatings
                        .sort((a, b) => b.likedBy.length - a.likedBy.length)
                        .map((rating) => (
                            <ReviewCard
                                key={rating._id}
                                reviewId={rating._id}
                                user={rating.userId as User}
                                rating={rating.movieRating}
                                review={rating.movieReview}
                                date={rating.date}
                                likes={rating.likedBy.length}
                                isOwnReview={
                                    (rating.userId as User)._id === userId
                                }
                            />
                        ))}
                {isFetched && movieRatings.length === 0 && (
                    <div className="flex justify-center italic">
                        No movie ratings yet
                    </div>
                )}
                {!isFetched && (
                    <div className="flex justify-center">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
};
