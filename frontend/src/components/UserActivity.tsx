import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { MovieRating, MovieShort, User } from "../lib/types";
import { getUser, getUserRatings } from "../lib/requests";
import { DarkLink } from "./DarkLink";

export const UserActivity = () => {
    const { userId } = useParams({ strict: false }) as { userId: string };

    const { data: userData } = useQuery<User>({
        queryKey: ["users", { userId }],
        queryFn: () => getUser(userId),
    });

    const { data: userRatings } = useQuery<MovieRating[]>({
        queryKey: ["ratings", { userId }],
        queryFn: () => getUserRatings(userId),
    });

    console.log(userRatings);

    const userName = `${userData!.firstName} ${userData!.lastName}`;

    return (
        <div className="flex flex-col my-20 mx-60 gap-10">
            {userRatings!.map((rating) => {
                const movie = rating.movieId as MovieShort;
                const ratingDate = new Date(rating.date);
                const parsedDate = ratingDate.toLocaleString("default", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                });
                return (
                    <div
                        key={rating._id}
                        className="p-5 rounded-lg shadow-lg bg-amber-100"
                    >
                        <div className="flex justify-between">
                            <p className="flex items-center">
                                <img
                                    src={userData!.photo}
                                    className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                                />
                                <span className="font-bold">
                                    {userName} rated {rating.movieRating}/10{" "}
                                    <DarkLink
                                        text={`${movie.title} (${movie.releaseYear})`}
                                        to={`/movies/${movie._id}`}
                                    />
                                </span>
                            </p>
                            <p>
                                <span className="italic">{parsedDate}</span>
                            </p>
                        </div>
                        {rating.movieReview && (
                            <p className="mt-2">
                                <strong>Review</strong>: {rating.movieReview}
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
