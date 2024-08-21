import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getAuthStatus, getMovieRatings } from "../../lib/requests";
import { MovieRating, User, AuthStatus } from "../../lib/types";
import { ReviewCard } from "./MovieReviewCard";

export const MovieReviews = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data: movieRatings } = useQuery<MovieRating[]>({
        queryKey: ["movie", "ratings", { movieId: movieId }],
        queryFn: () => getMovieRatings(movieId),
    });

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        enabled: false,
    });

    const userId = authStatus!.userData?._id;

    return (
        <div>
            <hr className="h-px mb-5 bg-amber-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {movieRatings!.length > 0 &&
                    movieRatings!.map((rating) => (
                        <ReviewCard
                            key={rating._id}
                            reviewId={rating._id}
                            user={rating.userId as User}
                            rating={rating.movieRating}
                            review={rating.movieReview}
                            date={rating.date}
                            likes={rating.likedBy.length}
                            isOwnReview={(rating.userId as User)._id === userId}
                        />
                    ))}
                {movieRatings!.length === 0 && (
                    <div className="flex justify-center italic">
                        No movie ratings yet
                    </div>
                )}
            </div>
        </div>
    );
};
