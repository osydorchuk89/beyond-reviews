import { createFileRoute } from "@tanstack/react-router";
import { getMovies, getUser, queryClient } from "../lib/requests";
import { FavoriteMovies } from "../components/FavoriteMovies";
import { redirectIfNotAuthenticated } from "../lib/auth";
import { Movie, User } from "../lib/types";
import { LoadingComponent } from "../components/LoadingComponent";

export const Route = createFileRoute("/users/$userId/fav-movies")({
    component: FavoriteMovies,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", "favorite-movies", { userId: params.userId }],
            queryFn: async () => {
                const user: User = await getUser(params.userId);
                const favMovies: Movie[] = await getMovies(user.likes);
                return favMovies;
            },
        }),
    beforeLoad: redirectIfNotAuthenticated,
    pendingComponent: LoadingComponent,
});
