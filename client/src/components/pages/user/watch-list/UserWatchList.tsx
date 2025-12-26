import { useLoaderData, useRouteLoaderData } from "react-router";

import { MovieWatchList, User } from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { MovieCard } from "../../movies/MovieCard";
import { ButtonLink } from "../../../ui/ButtonLink";

export const UserWatchList = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userWatchList } = useLoaderData() as {
        userWatchList: MovieWatchList[];
    };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);

    return (
        <div className="flex flex-col gap-10 justify-center items-center min-h-[70vh]">
            <h2 className="text-2xl text-center font-bold">
                {isSameUser ? "Your" : `${profileUserName}'s`} watchlist
            </h2>
            {userWatchList.length > 0 ? (
                <div className="grid grid-cols-3 items-center gap-16 mx-5">
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
                <div className="flex flex-col justify-center items-center gap-10 my-32">
                    <p className="text-lg">
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
        </div>
    );
};
