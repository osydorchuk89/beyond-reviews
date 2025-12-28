import { useLoaderData } from "react-router";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieReviews } from "./MovieReviews";
import { ButtonLink } from "../../../ui/ButtonLink";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import { Movie, MovieReview } from "../../../../lib/entities";

export const MoviePage = () => {
    const { movie, movieReviews } = useLoaderData() as {
        movie: Movie;
        movieReviews: MovieReview[];
    };

    if (!movie) {
        return (
            <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
                <article className="flex flex-col gap-4 text-center text-xl">
                    <h2>Oops!</h2>
                    <h2>The page for this movie does not exist</h2>
                </article>
                <ButtonLink to="/movies" style="orange">
                    BACK TO ALL MOVIES
                </ButtonLink>
            </div>
        );
    }

    return (
        <div className="flex flex-col mx-48 text-sky-950 relative">
            <div className="flex gap-10 py-10">
                <MovieMainInfo movie={movie} />
                <MovieAdditionalInfo
                    movie={movie}
                    movieReviews={movieReviews}
                />
            </div>
            <MovieReviews movieReviews={movieReviews} />
        </div>
    );
};
