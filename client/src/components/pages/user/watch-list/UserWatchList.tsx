import { useLoaderData, useNavigate, useRouteLoaderData } from "react-router";

import { MovieWatchList, User } from "../../../../lib/entities";
import { useUserIdentity } from "../../../../hooks/useUserIdentity";
import { MovieCard } from "../../movies/MovieCard";
import { BaseButton } from "../../../ui/BaseButton";

export const UserWatchList = () => {
    const { user } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userWatchList } = useLoaderData() as {
        userWatchList: MovieWatchList[];
    };
    const { isSameUser, userName } = useUserIdentity(user);

    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-10 justify-center items-center min-h-[70vh]">
            <h2 className="text-2xl text-center font-bold">
                {isSameUser ? "Your" : `${userName}'s`} watchlist
            </h2>
            {userWatchList.length > 0 ? (
                <div className="grid grid-cols-3 items-center gap-16 mx-5">
                    {userWatchList.map((item) => (
                        <MovieCard
                            id={item.movieId}
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
                        {isSameUser ? "your" : `${userName}'s`} watchlist
                    </p>
                    {isSameUser && (
                        <BaseButton
                            text="EXPLORE MOVIES"
                            style="orange"
                            handleClick={() => navigate("/movies")}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
