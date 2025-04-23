import { useState } from "react";
import { useSearchParams } from "react-router";

import { MovieCard } from "./MovieCard";
import { Movie } from "../../../lib/entities";
import { Button } from "../../ui/Button";
import { CloseIcon } from "../../icons/CloseIcon";

interface MoviesListProps {
    movies: Movie[];
    subtitle?: string;
}

export const MoviesList = ({ movies, subtitle }: MoviesListProps) => {
    const [_, setSearchParams] = useSearchParams();

    const [numberMovies, setNumberMovies] = useState(15);

    const handleCloseFilterTag = () => {
        setSearchParams((searchParams) => {
            searchParams.delete("filter");
            return searchParams;
        });
    };

    return (
        <div className="flex flex-col w-full">
            {subtitle && (
                <div className="flex gap-4 items-center w-fit self-center px-4 py-3 mb-8 bg-orange-300 rounded-md">
                    <span className="text-orange-950 text-xl text-center leading-0">
                        {subtitle}
                    </span>
                    <CloseIcon handleClick={handleCloseFilterTag} />
                </div>
            )}
            <div className="flex flex-col gap-10 mb-10 items-center">
                {movies.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-16 mx-5">
                            {movies
                                .slice(0, numberMovies)
                                .map((movie: Movie) => (
                                    <MovieCard
                                        key={movie.id}
                                        id={movie.id}
                                        title={movie.title}
                                        releaseYear={movie.releaseYear}
                                        genres={movie.genres}
                                        avgRating={movie.avgRating}
                                        numRatings={movie.numRatings}
                                        poster={movie.poster}
                                    />
                                ))}
                        </div>
                        {numberMovies < movies.length && (
                            <div className="flex justify-center mb-10">
                                <Button
                                    text="LOAD MORE"
                                    style="sky"
                                    handleClick={() =>
                                        setNumberMovies(
                                            (prevState) => prevState + 15
                                        )
                                    }
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex justify-center items-start mt-20 h-[50vh]">
                        <p className="text-2xl">No movies found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
