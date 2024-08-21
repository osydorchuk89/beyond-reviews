import { createFileRoute } from "@tanstack/react-router";
import { getUser, queryClient } from "../lib/requests";
import { redirectIfNotAuthenticated } from "../lib/auth";
import { UserFriends } from "../components/userPage/UserFriends";

export const Route = createFileRoute("/users/$userId/friends")({
    component: UserFriends,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", { userId: params.userId }],
            queryFn: () => getUser(params.userId),
        }),
    beforeLoad: redirectIfNotAuthenticated,
});
