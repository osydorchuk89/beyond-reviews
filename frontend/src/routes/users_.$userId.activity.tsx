import { createFileRoute } from "@tanstack/react-router";
import { getUser, getUserRatings, queryClient } from "../lib/requests";
import { UserActivity } from "../components/UserActivity";

export const Route = createFileRoute("/users/$userId/activity")({
    component: UserActivity,
    loader: async ({ params }) => {
        await queryClient.prefetchQuery({
            queryKey: ["ratings", { userId: params.userId }],
            queryFn: () => getUserRatings(params.userId),
        });
        await queryClient.prefetchQuery({
            queryKey: ["users", { userId: params.userId }],
            queryFn: () => getUser(params.userId),
        });
    },
});
