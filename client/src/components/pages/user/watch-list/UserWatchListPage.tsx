import { Suspense } from "react";
import { Await, useLoaderData, useRouteLoaderData } from "react-router";

import {
    MovieRecommendationsData,
    MovieWatchList,
    User,
} from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { MovieCard } from "../../movies/MovieCard";
import { ButtonLink } from "../../../ui/ButtonLink";
import { MovieRecommendationsSection } from "../../movies/MovieRecommendationsSection";
import { MovieRecommendationsLoadingSection } from "../../movies/MovieRecommendationsLoadingSection";

export const UserWatchListPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userWatchList, movieRecommendationsDataPromise } =
        useLoaderData() as {
            userWatchList: MovieWatchList[];
            movieRecommendationsDataPromise: Promise<MovieRecommendationsData | null>;
        };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    return (
        <div className="flex flex-col gap-10 justify-center items-center min-h-[70vh] w-full">
            <h2 className="text-xl text-center font-bold">Watchlist</h2>
            {userWatchList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-center justify-items-center gap-8 sm:gap-12 lg:gap-16 w-full">
                    {userWatchList.map((item) => (
                        <MovieCard
                            movieId={item.movieId}
                            key={item.movieId}
                            title={item.movie.title}
                            releaseYear={item.movie.releaseYear}
                            genres={item.movie.genres}
                            avgRating={item.movie.avgRating}
                            numRatings={item.movie.numRatings}
                            poster={item.movie.poster}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center gap-10 my-20 sm:my-32 text-center">
                    <p className="text-lg break-words">
                        There are no movies on{" "}
                        {isSameUser ? "your" : `${profileUserName}'s`} watchlist
                    </p>
                    {isSameUser && (
                        <ButtonLink style="orange" to="/movies">
                            EXPLORE MOVIES
                        </ButtonLink>
                    )}
                </div>
            )}
            <Suspense fallback={<MovieRecommendationsLoadingSection />}>
                <Await resolve={movieRecommendationsDataPromise}>
                    {(movieRecommendationsData) =>
                        movieRecommendationsData ? (
                            <MovieRecommendationsSection
                                movieRecommendationsData={
                                    movieRecommendationsData
                                }
                            />
                        ) : null
                    }
                </Await>
            </Suspense>
        </div>
    );
};
