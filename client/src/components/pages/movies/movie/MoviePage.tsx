import { useLoaderData, useRouteLoaderData, useFetchers } from "react-router";

import { MovieMainInfo } from "./MovieMainInfo";
import { MovieAdditionalInfo } from "./MovieAdditionalInfo";
import { MovieReviewSection } from "./MovieReviewSection";
import { MovieReviews } from "./MovieReviews";
import { AuthData, MovieData } from "../../../../lib/entities";
import { LoadingSpinner } from "../../../ui/LoadingSpinner";
import { MovieBookmark } from "./MovieBookmark";
import { ButtonLink } from "../../../ui/ButtonLink";

export const MoviePage = () => {
    const { movie, movieReviews } = useLoaderData() as MovieData;
    console.log(movie);
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };

    const fetchers = useFetchers();
    const isUpdating = fetchers.some((f) => f.state !== "idle");

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
                <div className="flex flex-col w-2/3 text-lg">
                    {isUpdating ? (
                        <LoadingSpinner />
                    ) : (
                        <>
                            {authData.user && (
                                <MovieBookmark
                                    movie={movie}
                                    authData={authData}
                                />
                            )}
                            <MovieAdditionalInfo
                                movie={movie}
                                authData={authData}
                            />
                            <MovieReviewSection
                                movie={movie}
                                movieReviews={movieReviews}
                                authData={authData}
                            />
                        </>
                    )}
                </div>
            </div>
            <MovieReviews movieReviews={movieReviews} authData={authData} />
        </div>
    );
};
