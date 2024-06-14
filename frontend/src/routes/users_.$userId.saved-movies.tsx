import { createFileRoute } from "@tanstack/react-router";
import { getUserSavedMovies, queryClient } from "../lib/requests";
import { SavedMovies } from "../components/SavedMovies";
import { redirectIfNotAuthenticated } from "../lib/auth";
import { LoadingComponent } from "../components/LoadingComponent";

export const Route = createFileRoute("/users/$userId/saved-movies")({
    component: SavedMovies,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", "saved-movies", { userId: params.userId }],
            queryFn: () => getUserSavedMovies(params.userId),
        }),
    beforeLoad: redirectIfNotAuthenticated,
    pendingComponent: LoadingComponent,
});
