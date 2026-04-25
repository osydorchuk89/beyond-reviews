import { useLoaderData } from "react-router";
import { ToastContainer } from "react-toastify";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieReviews } from "./MovieReviews";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import { Movie, MovieReview } from "../../../lib/entities";
import { ButtonLink } from "../../ui/ButtonLink";
import { horizontalPadding } from "../../../styles/responsive";

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
        <div
            className={`flex flex-col w-full mx-auto ${horizontalPadding.page} text-sky-950 relative`}
        >
            <ToastContainer
                autoClose={3000}
                hideProgressBar
                toastStyle={{
                    backgroundColor: "#bae6fd",
                    paddingBlock: 0,
                    paddingInline: 20,
                }}
            />
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-6 sm:py-10">
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
