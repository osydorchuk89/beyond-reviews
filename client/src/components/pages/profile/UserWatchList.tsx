import {
    useLoaderData,
    useNavigate,
    useRouteLoaderData,
} from "react-router";

import { MovieWatchList, User } from "../../../lib/entities";
import { MovieCard } from "../movies/MovieCard";
import { Button } from "../../ui/Button";
import { useAuthData } from "../../../hooks/useAuthData";

export const UserWatchList = () => {
    const { user } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { userWatchList } = useLoaderData() as {
        userWatchList: MovieWatchList[];
    };

    const { authData } = useAuthData();
    const isSameUser = (authData.user && user.id === authData.user.id) || false;
    const userName = `${user.firstName} ${user.lastName}`;

    const navigate = useNavigate();

    return (
        <div className="flex flex-col my-20 mx-60 gap-10 justify-center items-center min-h-[60vh]">
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
                        <Button
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
