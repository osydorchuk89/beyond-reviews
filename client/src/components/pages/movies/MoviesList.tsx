import { Movie } from "../../../lib/entities";
import { MovieCard } from "./MovieCard";

interface MoviesListProps {
    allMovies: Movie[];
}

export const MoviesList = ({ allMovies }: MoviesListProps) => {
    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-center justify-items-center lg:justify-items-end w-full gap-16">
            {allMovies.map((movie: Movie) => (
                <MovieCard
                    key={movie.id}
                    movieId={movie.id}
                    title={movie.title}
                    releaseYear={movie.releaseYear}
                    genres={movie.genres}
                    avgRating={movie.avgRating}
                    numRatings={movie.numRatings}
                    poster={movie.poster}
                />
            ))}
        </ul>
    );
};
