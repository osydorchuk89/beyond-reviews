import { Movie } from "../../../lib/entities";

export const MovieMainInfo = ({ movie }: { movie: Movie }) => {
    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-10 w-1/3">
            <p className="text-4xl text-center font-semibold">{movie.title}</p>
            <img className="w-80 rounded-lg" src={movie.poster} />
        </div>
    );
};
