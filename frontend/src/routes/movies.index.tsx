import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Movie } from "../lib/types";
import { SearchBar } from "../components/SearchBar";
import { SortFilterBar } from "../components/SortFilterBar";
import { MovieCard } from "../components/MovieCard";
import { Button } from "../components/Button";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { getMovies } from "../lib/requests";
import { filterList, sortList } from "../lib/data";

const movieSearchSchema = z.object({
    search: z.string().optional().catch(""),
    filter: z.string().optional().catch(""),
    sort: z.string().optional().catch(""),
});

const loadingComponent = () => {
    return (
        <div className="w-full h-full flex justify-center items-center">
            <LoadingSpinner />
        </div>
    );
};

const Movies = () => {
    const moviesData: Movie[] = Route.useLoaderData();
    const [numberMovies, setNumberMovies] = useState(20);
    const { search, filter, sort } = Route.useSearch();

    let sortedMovies = moviesData;

    switch (sort) {
        case "oldest":
            sortedMovies = moviesData.sort(
                (a, b) => a.releaseYear - b.releaseYear
            );
            break;
        case "newest":
            sortedMovies = moviesData.sort(
                (a, b) => b.releaseYear - a.releaseYear
            );
            break;
        case "highestRating":
            sortedMovies = moviesData.sort((a, b) => b.avgRating - a.avgRating);
            break;
        case "mostVotes":
            sortedMovies = moviesData.sort(
                (a, b) => b.numRatings - a.numRatings
            );
            break;
    }

    switch (filter) {
        case "year2023":
            sortedMovies = moviesData.filter(
                (item) => item.releaseYear === 2023
            );
            break;
        case "year2024":
            sortedMovies = moviesData.filter(
                (item) => item.releaseYear === 2024
            );
            break;
        case "genreAction":
            sortedMovies = moviesData.filter((item) =>
                item.genres.includes("Action")
            );
            break;
        case "genreDrama":
            sortedMovies = moviesData.filter((item) =>
                item.genres.includes("Drama")
            );
            break;
    }

    if (search) {
        const searchTerm = search.toLowerCase();
        sortedMovies = sortedMovies.filter((item) =>
            item.title.toLowerCase().includes(searchTerm)
        );
        console.log(sortedMovies);
    }

    return (
        <div>
            <p className="text-4xl text-center font-bold mt-10 mb-5">
                Popular Movies
            </p>
            <SearchBar />
            <div className="flex gap-8">
                <SortFilterBar itemsList={sortList} title="Sort By:" />
                <SortFilterBar itemsList={filterList} title="Filter:" />
            </div>

            <div className="grid grid-cols-4 items-center gap-16 my-10 mx-5">
                {sortedMovies.slice(0, numberMovies).map((movie: Movie) => (
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
            {numberMovies < sortedMovies.length && (
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
    pendingComponent: loadingComponent,
    validateSearch: movieSearchSchema,
});
