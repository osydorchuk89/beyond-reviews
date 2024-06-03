import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoadingComponent } from "../components/LoadingComponent";
import { getMovies, queryClient } from "../lib/requests";
import { Movies } from "../components/Movies";

const movieSearchSchema = z.object({
    search: z.string().optional().catch(""),
    filter: z.string().optional().catch(""),
    sort: z.string().optional().catch(""),
});

export const Route = createFileRoute("/movies/")({
    component: Movies,
    loader: () =>
        queryClient.ensureQueryData({
            queryKey: ["movies"],
            queryFn: () => getMovies([]),
        }),
    pendingComponent: LoadingComponent,
    validateSearch: movieSearchSchema,
});
