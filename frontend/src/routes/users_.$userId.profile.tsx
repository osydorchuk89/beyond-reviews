import { createFileRoute } from "@tanstack/react-router";
import { getUser, queryClient } from "../lib/requests";

const UserProfile = () => {
    return (
        <div className="flex flex-col my-20 mx-40 p-5 rounded-lg shadow-lg bg-amber-100">
            <div>Hello, user</div>
        </div>
    );
};

export const Route = createFileRoute("/users/$userId/profile")({
    component: UserProfile,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", { userId: params.userId }],
            queryFn: () => getUser(params.userId),
        }),
});
