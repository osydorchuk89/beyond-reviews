import { createFileRoute } from "@tanstack/react-router";
import { getUser, queryClient } from "../lib/requests";
import { UserProfile } from "../components/userPage/UserProfile";
// import { redirectIfNotAuthenticated } from "../lib/auth";

export const Route = createFileRoute("/users/$userId/profile")({
    component: UserProfile,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", { userId: params.userId }],
            queryFn: () => getUser(params.userId),
        }),
    // beforeLoad: redirectIfNotAuthenticated,
});
