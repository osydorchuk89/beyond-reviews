import { Movie } from "../../../../lib/entities";

interface MovieMainInfoProps {
    movie: Movie;
}

export const MovieMainInfo = ({ movie }: MovieMainInfoProps) => {
    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-10 w-1/3">
            <p className="text-4xl text-center font-semibold">{movie.title}</p>
            <img className="w-80 rounded-lg" src={movie.poster} alt="movie poster" />
        </div>
    );
};
