import { Movie } from "../../../../lib/entities";
import { getMoviePoster } from "../../../../lib/utils";

interface MovieMainInfoProps {
    movie: Movie;
}

export const MovieMainInfo = ({ movie }: MovieMainInfoProps) => {
    const moviePoster = getMoviePoster(movie.poster);
    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-10 w-1/3">
            <p className="text-4xl text-center font-semibold">{movie.title}</p>
            <img
                className="w-80 rounded-lg"
                src={moviePoster}
                alt="movie poster"
            />
        </div>
    );
};
