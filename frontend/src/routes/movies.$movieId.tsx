import { createFileRoute } from "@tanstack/react-router";
import { getMovie, getMovieRatings, queryClient } from "../lib/requests";
import { MovieDetails } from "../components/moviePage/MovieDetails";

export const Route = createFileRoute("/movies/$movieId")({
    component: MovieDetails,
    loader: async ({ params }) => {
        await queryClient.prefetchQuery({
            queryKey: ["movie", "ratings", { movieId: params.movieId }],
            queryFn: () => getMovieRatings(params.movieId),
        });
        await queryClient.prefetchQuery({
            queryKey: ["movie", { movieId: params.movieId }],
            queryFn: () => getMovie(params.movieId),
        });
    },
});
