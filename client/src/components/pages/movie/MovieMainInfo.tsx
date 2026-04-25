import { useRouteLoaderData } from "react-router";

import { AuthData, Movie } from "../../../lib/entities";
import { getMoviePoster } from "../../../lib/utils";
import { MovieBookmark } from "./MovieBookmark";

interface MovieMainInfoProps {
    movie: Movie;
}

export const MovieMainInfo = ({ movie }: MovieMainInfoProps) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const moviePoster = getMoviePoster(movie.poster);

    return (
        <div className="flex flex-col flex-wrap justify-start items-center gap-0 md:gap-6 w-full lg:w-1/3 relative">
            {authData.user && (
                <div className="block md:hidden">
                    <MovieBookmark movie={movie} authData={authData} />
                </div>
            )}
            <p className="mb-6 md:mb-0 text-2xl sm:text-3xl md:text-4xl text-center font-semibold">
                {movie.title}
            </p>
            <img
                className="w-full max-w-80 rounded-lg"
                src={moviePoster}
                alt="movie poster"
            />
        </div>
    );
};
