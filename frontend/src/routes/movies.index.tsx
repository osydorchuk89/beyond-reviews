import axios from "axios";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Movie } from "../lib/types";
import { BASE_API_URL } from "../lib/urls";
import { MovieCard } from "../components/MovieCard";
import { DarkButton } from "../components/DarkButton";

const Movies = () => {
    const moviesData = Route.useLoaderData();
    const [numberMovies, setNumberMovies] = useState(20);

    return (
        <div>
            <p className="text-4xl text-center font-bold mt-10">
                Popular Movies
            </p>
            <div className="flex flex-wrap justify-between items-center gap-12 p-10 after:content-[''] after:flex-[auto]">
                {moviesData.slice(0, numberMovies).map((movie: Movie) => (
                    <MovieCard
                        _id={movie._id}
                        key={movie._id}
                        title={movie.title}
                        releaseYear={movie.releaseYear}
                        genres={movie.genres}
                        avgRating={movie.avgRating}
                        numRatings={movie.numRatings}
                        poster={movie.poster}
                    />
                ))}
            </div>
            {numberMovies < moviesData.length && (
                <div className="flex justify-center mb-10">
                    <DarkButton
                        text="LOAD MORE"
                        handleClick={() =>
                            setNumberMovies((prevState) => prevState + 20)
                        }
                    />
                </div>
            )}
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

export const Route = createFileRoute("/movies/")({
    component: Movies,
    loader: fetchMovies,
});
