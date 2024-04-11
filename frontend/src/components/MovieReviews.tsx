import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getMovie } from "../lib/requests";
import { MovieRating, User } from "../lib/types";
import { StarIcon } from "./StarIcon";

interface ReviewCardProps {
    user: User;
    rating: number;
    review?: string;
    date: Date;
}

const ReviewCard = ({ user, rating, review, date }: ReviewCardProps) => {
    const reviewDate = new Date(date);
    const parsedDate = reviewDate.toLocaleString("default", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex flex-col items-start bg-amber-100 rounded-lg shadow-lg p-5">
            <div className="flex flex-col w-full mb-3">
                <div className="flex justify-between">
                    <p className="font-bold">
                        {user.firstName} {user.lastName}
                    </p>
                    <div className="flex">
                        <span>
                            <StarIcon className="w-6 h-6 fill-yellow-500 border-none" />
                        </span>
                        <span className="font-bold">{rating}</span>
                        <span className="text-gray-500 font-bold">/10</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500">{parsedDate}</p>
            </div>
            <p className="w-full">{review}</p>
        </div>
    );
};

export const MovieReviews = () => {
    const { movieId } = useParams({ strict: false }) as { movieId: string };
    const { data } = useQuery({
        queryKey: ["movie", { movieId: movieId }],
        queryFn: () => getMovie(movieId),
        enabled: false,
    });
    const movieRatings = data.ratings as MovieRating[];

    return (
        <div>
            <hr className="h-px mb-5 bg-amber-400 border-0" />
            <p className="text-center text-xl font-bold">User Reviews</p>
            <div className="flex flex-col my-5 gap-5">
                {movieRatings.map((rating) => (
                    <ReviewCard
                        key={rating._id}
                        user={rating.userId as User}
                        rating={rating.movieRating}
                        review={rating.movieReview}
                        date={rating.date}
                    />
                ))}
            </div>
        </div>
    );
};
