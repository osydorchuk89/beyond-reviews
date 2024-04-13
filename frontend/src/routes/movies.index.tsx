import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Movie } from "../lib/types";
import { MovieCard } from "../components/MovieCard";
import { Button } from "../components/Button";
import { getMovies } from "../lib/requests";

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
                    <Button
                        text="LOAD MORE"
                        style="dark"
                        handleClick={() =>
                            setNumberMovies((prevState) => prevState + 20)
                        }
                    />
                </div>
            )}
        </div>
    );
};

export const Route = createFileRoute("/movies/")({
    component: Movies,
    loader: getMovies,
});
