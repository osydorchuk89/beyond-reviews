import { useFetchers, useRouteLoaderData } from "react-router";

import { AuthData, Movie, MovieReview } from "../../../../lib/entities";
import { MovieBookmark } from "./MovieBookmark";
import { MovieDetails } from "./MovieDetails";
import { MovieReviewSection } from "./MovieReviewSection";
import { LoadingSpinner } from "../../../ui/LoadingSpinner";

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
        <div className="flex flex-col w-2/3 text-lg">
            {isUpdating ? (
                <LoadingSpinner />
            ) : (
                <>
                    {authData.user && (
                        <MovieBookmark movie={movie} authData={authData} />
                    )}
                    <MovieDetails movie={movie} authData={authData} />
                    <MovieReviewSection
                        movieReviews={movieReviews}
                        authData={authData}
                    />
                </>
            )}
        </div>
    );
};
