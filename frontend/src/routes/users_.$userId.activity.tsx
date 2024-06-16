import { createFileRoute } from "@tanstack/react-router";
import { getUserActivity, queryClient } from "../lib/requests";
import { UserActivity } from "../components/UserActivity";
import { redirectIfNotAuthenticated } from "../lib/auth";

export const Route = createFileRoute("/users/$userId/activity")({
    component: UserActivity,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["activity", { userId: params.userId }],
            queryFn: () => getUserActivity(params.userId),
        }),
    beforeLoad: redirectIfNotAuthenticated,
    // loader: async ({ params }) => {
    //     await queryClient.prefetchQuery({
    //         queryKey: ["ratings", { userId: params.userId }],
    //         queryFn: () => getUserRatings(params.userId),
    //     });
    //     await queryClient.prefetchQuery({
    //         queryKey: ["users", { userId: params.userId }],
    //         queryFn: () => getUser(params.userId),
    //     });
    // },
});
