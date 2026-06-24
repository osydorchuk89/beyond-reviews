import { Suspense } from "react";
import { Await } from "react-router";

import {
    MovieRecommendationsData,
    WishlistData,
} from "../../../../lib/entities";
import { MovieCard } from "../../movies/MovieCard";
import { MovieRecommendationsLoadingSection } from "../../movies/MovieRecommendationsLoadingSection";
import { MovieRecommendationsSection } from "../../movies/MovieRecommendationsSection";
import { WishlistEmptyState } from "./WishlistEmptyState";

interface MoviesWishlistContentProps {
    wishlistData: WishlistData;
    movieRecommendationsDataPromise: Promise<MovieRecommendationsData | null> | null;
    isSameUser: boolean;
    profileUserName: string;
}

export const MoviesWishlistContent = ({
    wishlistData,
    movieRecommendationsDataPromise,
    isSameUser,
    profileUserName,
}: MoviesWishlistContentProps) => (
    <>
        {wishlistData.movies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 items-center justify-items-center gap-8 sm:gap-12 lg:gap-16 w-full">
                {wishlistData.movies.map((item) => (
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
            <WishlistEmptyState
                isSameUser={isSameUser}
                profileUserName={profileUserName}
                mediaLabel="movies"
                exploreTo="/movies"
                exploreLabel="EXPLORE MOVIES"
            />
        )}

        {movieRecommendationsDataPromise && (
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
        )}
    </>
);
