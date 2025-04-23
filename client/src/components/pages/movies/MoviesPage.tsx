import { useLoaderData, useSearchParams } from "react-router";

import { MoviesList } from "./MoviesList";
import { SearchBar } from "./SearchBar";
import { Movie } from "../../../lib/entities";
import { SortFilterBar } from "./SortFilterBar";
import { sideBarFilterList, sideBarSortList } from "../../../lib/data";

export const MoviesPage = () => {
    let { movies }: { movies: Movie[] } = useLoaderData();

    const [searchParams] = useSearchParams();

    const searchTerm = searchParams.get("search");
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    let filterSubtitle = "";
    
    switch (sort) {
        case "oldest":
            movies = movies.sort((a, b) => a.releaseYear - b.releaseYear);
            break;
        case "newest":
            movies = movies.sort((a, b) => b.releaseYear - a.releaseYear);
            break;
        case "highestRating":
            movies = movies.sort((a, b) => b.avgRating - a.avgRating);
            break;
        case "mostVotes":
            movies = movies.sort((a, b) => b.numRatings - a.numRatings);
            break;
        case "":
            movies = movies.sort((a, b) => b.releaseYear - a.releaseYear);
            break;
        default:
            movies = movies.sort((a, b) => b.releaseYear - a.releaseYear);
    }

    if (filter?.startsWith("year")) {
        const year = +filter.split("-")[1];
        movies = movies.filter((item) => item.releaseYear === year);
        filterSubtitle = `Movies released in ${year}`;
    } else if (filter?.startsWith("genre")) {
        const genre = filter.split("-")[1];
        movies = movies.filter((item) => item.genres.includes(genre));
        filterSubtitle = `${genre} movies`;
    } else if (filter?.startsWith("director")) {
        const director = filter.split("-")[1];
        movies = movies.filter((item) => item.director === director);
        filterSubtitle = `Movies directed by ${director}`;
    }

    if (searchTerm && searchTerm !== "") {
        movies = movies.filter((movie: Movie) =>
            movie.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return (
        <div className="flex flex-col w-full">
            <p className="text-4xl text-center font-bold py-10 mb-5">
                Popular Movies
            </p>
            <div className="flex flex-col md:flex-row items-center md:items-start">
                <div className="flex flex-col w-5/6 md:w-1/4 ml-5 gap-8 mb-5">
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
                <div className="flex flex-col w-full md:w-3/4">
                    <MoviesList movies={movies} subtitle={filterSubtitle} />
                </div>
            </div>
        </div>
    );
};
