import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Movie } from "../lib/types";
import { getMovies } from "../lib/requests";
import { SearchBar } from "./SearchBar";
import { SortFilterBar } from "./SortFilterBar";
import { sideBarFilterList, sideBarSortList } from "../lib/data";
import { MovieCard } from "./MovieCard";
import { Button } from "./Button";
import { Route } from "../routes/movies.index";

export const Movies = () => {
    const navigate = useNavigate();

    const { data: movies } = useQuery<Movie[]>({
        queryKey: ["movies"],
        queryFn: () => getMovies(),
    });

    const [numberMovies, setNumberMovies] = useState(15);
    const { search, filter, sort } = Route.useSearch();

    useEffect(() => {
        if (!search && !filter && !sort) {
            navigate({ search: {} });
        }
    }, []);

    let sortedMovies = movies as Movie[];

    switch (sort) {
        case "oldest":
            sortedMovies = sortedMovies.sort(
                (a, b) => a.releaseYear - b.releaseYear
            );
            break;
        case "newest":
            sortedMovies = sortedMovies.sort(
                (a, b) => b.releaseYear - a.releaseYear
            );
            break;
        case "highestRating":
            sortedMovies = sortedMovies.sort(
                (a, b) => b.avgRating - a.avgRating
            );
            break;
        case "mostVotes":
            sortedMovies = sortedMovies.sort(
                (a, b) => b.numRatings - a.numRatings
            );
            break;
        case "":
            sortedMovies = sortedMovies.sort(
                (a, b) => b.releaseYear - a.releaseYear
            );
            break;
        default:
            sortedMovies = sortedMovies.sort(
                (a, b) => b.releaseYear - a.releaseYear
            );
    }

    if (filter?.startsWith("year")) {
        const year = +filter.split("-")[1];
        sortedMovies = sortedMovies.filter((item) => item.releaseYear === year);
    } else if (filter?.startsWith("genre")) {
        const genre = filter.split("-")[1];
        sortedMovies = sortedMovies.filter((item) =>
            item.genres.includes(genre)
        );
    } else if (filter?.startsWith("director")) {
        const director = filter.split("-")[1];
        sortedMovies = sortedMovies.filter(
            (item) => item.director === director
        );
    }

    // switch (filter) {
    //     case "year2023":
    //         sortedMovies = sortedMovies.filter(
    //             (item) => item.releaseYear === 2023
    //         );
    //         break;
    //     case "year2024":
    //         sortedMovies = sortedMovies.filter(
    //             (item) => item.releaseYear === 2024
    //         );
    //         break;
    //     case "genreAction":
    //         sortedMovies = sortedMovies.filter((item) =>
    //             item.genres.includes("Action")
    //         );
    //         break;
    //     case "genreDrama":
    //         sortedMovies = sortedMovies.filter((item) =>
    //             item.genres.includes("Drama")
    //         );
    //         break;
    //     case "director-denis-villeneuve":
    //         sortedMovies = sortedMovies.filter(
    //             (item) => item.director === "Denis Villeneuve"
    //         );
    //         break;
    // }

    if (search) {
        const searchTerm = search.toLowerCase();
        sortedMovies = sortedMovies.filter((item) =>
            item.title.toLowerCase().includes(searchTerm)
        );
    }

    return (
        <div className="flex flex-col w-full">
            <p className="text-4xl text-center font-bold py-10 mb-5 border-b border-b-amber-700">
                Popular Movies
            </p>
            <div className="flex">
                <div className="flex flex-col w-1/4 ml-5 gap-2 mb-5">
                    <SearchBar />
                    <SortFilterBar
                        itemsList={sideBarSortList}
                        title="Sort by:"
                    />
                    <SortFilterBar
                        itemsList={sideBarFilterList}
                        title="Filter:"
                    />
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
                                <div className="flex justify-center items-start mt-20 h-[50vh]">
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
                                                (prevState) => prevState + 15
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
