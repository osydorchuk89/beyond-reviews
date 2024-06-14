import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { MovieCard } from "./MovieCard";
import { Movie } from "../lib/types";
import { getUserSavedMovies } from "../lib/requests";
import { Button } from "./Button";

export const SavedMovies = () => {
    const { userId } = useParams({ strict: false }) as { userId: string };

    const { data: moviesData } = useQuery<Movie[]>({
        queryKey: ["users", "saved-movies", { userId }],
        queryFn: () => getUserSavedMovies(userId),
    });

    const navigate = useNavigate();

    return (
        <div className="flex flex-col my-20 mx-60 gap-10 justify-center items-center">
            <p className="text-2xl font-bold">Watch List</p>

            {moviesData!.length > 0 ? (
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
            ) : (
                <div className="flex flex-col justify-center items-center gap-10 my-32">
                    <p className="text-lg">
                        There are no movies on your watch list
                    </p>
                    <Button
                        text="Explore movies"
                        style="dark"
                        handleClick={() => navigate({ to: "/movies" })}
                    ></Button>
                </div>
            )}
        </div>
    );
};
