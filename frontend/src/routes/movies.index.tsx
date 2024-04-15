import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
    const navigate = useNavigate();

    useEffect(() => {
        navigate({ search: {} });
    }, []);

    const moviesData: Movie[] = Route.useLoaderData();
    const [numberMovies, setNumberMovies] = useState(15);
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
    }

    return (
        <div className="flex flex-col w-full">
            <p className="text-4xl text-center font-bold my-10">
                Popular Movies
            </p>
            <div className="flex">
                <div className="flex flex-col w-1/4 ml-5 gap-2 ">
                    <SearchBar />
                    <SortFilterBar itemsList={sortList} title="Sort by:" />
                    <SortFilterBar itemsList={filterList} title="Filter:" />
                </div>
                <div className="flex flex-col w-3/4">
                    <div className="flex-col">
                        <div className="flex flex-col gap-10 mb-10">
                            {sortedMovies.length > 0 ? (
                                <div className="grid grid-cols-3 items-center gap-16 mx-5">
                                    {sortedMovies
                                        .slice(0, numberMovies)
                                        .map((movie: Movie) => (
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
                            ) : (
                                <div className="flex justify-center items-center h-[50vh]">
                                    <p className="text-2xl">No movies found</p>
                                </div>
                            )}
                            {numberMovies < sortedMovies.length && (
                                <div className="flex justify-center mb-10">
                                    <Button
                                        text="LOAD MORE"
                                        style="dark"
                                        handleClick={() =>
                                            setNumberMovies(
                                                (prevState) => prevState + 20
                                            )
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Route = createFileRoute("/movies/")({
    component: Movies,
    loader: getMovies,
    pendingComponent: loadingComponent,
    validateSearch: movieSearchSchema,
});
