import { useFetchers, useRouteLoaderData } from "react-router";

import { MovieBookmark } from "./MovieBookmark";
import { MovieDetails } from "./MovieDetails";
import { MovieReviewSection } from "./MovieReviewSection";
import { Movie, MovieReview, AuthData } from "../../../lib/entities";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

interface MovieAdditionalInfoProps {
    movie: Movie;
    movieReviews: MovieReview[];
}

export const MovieAdditionalInfo = ({
    movie,
    movieReviews,
}: MovieAdditionalInfoProps) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };

    const fetchers = useFetchers();
    const isUpdating = fetchers.some((f) => f.state !== "idle");

    return (
        <div className="flex flex-col w-full lg:w-2/3 text-base md:text-lg relative">
            {isUpdating ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="hidden md:block">
                        {authData.user && (
                            <MovieBookmark movie={movie} authData={authData} />
                        )}
                    </div>
                    <MovieDetails movie={movie} />
                    <MovieReviewSection
                        movieReviews={movieReviews}
                        authData={authData}
                    />
                </>
            )}
        </div>
    );
};
