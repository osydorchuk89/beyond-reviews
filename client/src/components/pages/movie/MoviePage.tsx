import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieReviews } from "./MovieReviews";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import type { AuthData, Movie, MovieReviewsData } from "../../../lib/entities";
import { useWishlistState } from "../../../hooks/useWishlistState";
import { getWishlistKey } from "../../../store";
import { ActionFeedback } from "../../ui/ActionFeedback";
import { ButtonLink } from "../../ui/ButtonLink";
import { horizontalPadding } from "../../../styles/responsive";

export const MoviePage = () => {
    const { authData } = useRouteLoaderData("root") as { authData: AuthData };
    const { movie, movieReviewsData } = useLoaderData() as {
        movie: Movie;
        movieReviewsData: MovieReviewsData;
    };
    const wishlistKey = movie
        ? getWishlistKey("Movie", movie.id, authData.user?.id)
        : null;
    const wishlist = useWishlistState(
        wishlistKey,
        (movie?.onWishlist ?? []).some(
            (entry) => entry.userId === authData.user?.id,
        ),
    );

    if (!movie) {
        return (
            <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
                <article className="flex flex-col gap-4 text-center text-xl">
                    <h1 tabIndex={-1}>Movie not found</h1>
                    <p>The page for this movie does not exist</p>
                </article>
                <ButtonLink to="/movies" style="orange">
                    BACK TO ALL MOVIES
                </ButtonLink>
            </div>
        );
    }

    return (
        <div
            key={wishlistKey}
            className={`flex flex-col w-full mx-auto ${horizontalPadding.page} text-sky-950 relative`}
        >
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-6 sm:py-10">
                <MovieMainInfo movie={movie} />
                <MovieAdditionalInfo
                    key={movie.id}
                    movie={movie}
                    userReview={movieReviewsData.userReview}
                />
            </div>
            <MovieReviews
                movieId={movie.id}
                initialMovieReviewsData={movieReviewsData}
            />
            <ActionFeedback
                status={wishlist?.status ?? ""}
                error={wishlist?.error ?? ""}
            />
        </div>
    );
};
