import { createFileRoute } from "@tanstack/react-router";
import { MovieMainInfo, MovieAddInfo } from "../components/MovieInfo";
import { MovieRatingForm } from "../components/MovieRatingForm";
import { MovieReviews } from "../components/MovieReviews";
import { getMovie, queryClient } from "../lib/requests";

const MovieDetails = () => {
    return (
        <div className="flex flex-col mx-48">
            <div className="flex gap-10 py-10">
                <MovieMainInfo />
                <div className="flex flex-col w-2/3 text-lg mt-2">
                    <MovieAddInfo />
                    <MovieRatingForm />
                </div>
            </div>
            <MovieReviews />
        </div>
    );
};

export const Route = createFileRoute("/movies/$movieId")({
    component: MovieDetails,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["movie", { movieId: params.movieId }],
            queryFn: () => getMovie(params.movieId),
        }),
});
