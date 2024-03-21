import axios from "axios";
import { createFileRoute } from "@tanstack/react-router";
import { BASE_API_URL } from "../lib/urls";
import { MovieCard } from "../components/MovieCard";

interface Movie {
    _id: string;
    title: string;
    releaseYear: number;
    overview: string;
    language: string;
    avgVote: number;
    numVotes: number;
    poster: string;
}

const Movies = () => {
    const moviesData = Route.useLoaderData();
    console.log(moviesData[0]);

    return (
        <div className="flex flex-wrap justify-between items-center gap-5 p-10">
            {moviesData.map((movie: Movie) => (
                <MovieCard
                    key={movie._id}
                    title={movie.title}
                    releaseYear={movie.releaseYear}
                    overview={movie.overview}
                    language={movie.language}
                    avgVote={movie.avgVote}
                    numVotes={movie.numVotes}
                    poster={movie.poster}
                />
            ))}
        </div>
    );
};

const fetchMovies = async () => {
    try {
        const response = await axios({
            method: "get",
            url: BASE_API_URL + "movies",
        });
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const Route = createFileRoute("/movies")({
    component: Movies,
    loader: fetchMovies,
});
