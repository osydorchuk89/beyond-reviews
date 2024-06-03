import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { MovieCard } from "./MovieCard";
import { Movie, User } from "../lib/types";
import { getMovies, getUser } from "../lib/requests";

export const FavoriteMovies = () => {
    const { userId } = useParams({ strict: false }) as { userId: string };

    const { data: moviesData, isPending } = useQuery<Movie[]>({
        queryKey: ["users", "favorite-movies", { userId }],
        queryFn: async () => {
            const user: User = await getUser(userId);
            const favMovies: Movie[] = await getMovies(user.likes);
            return favMovies;
        },
    });

    console.log(isPending);

    // const moviesData = useLoaderData({ from: "/users/$userId/fav-movies" });

    return (
        <div className="flex flex-col my-20 mx-60 gap-10 justify-center items-center">
            <p className="text-2xl font-bold">Favorite Movies</p>
            <div className="grid grid-cols-3 items-center gap-16 mx-5">
                {moviesData!.map((movie) => (
                    <MovieCard
                        _id={movie._id}
                        key={movie._id}
                        title={movie.title}
                        releaseYear={movie.releaseYear}
                        genres={movie.genres}
                        avgRating={movie.avgRating}
                        numRatings={movie.numRatings}
                        poster={movie.poster}
                    />
                ))}
            </div>
        </div>
    );
};
