import { createFileRoute } from "@tanstack/react-router";
import { getUser, queryClient } from "../lib/requests";

const UserReviews = () => {
    return (
        <div className="flex flex-col mx-48">
            <div>This is your reviews</div>
        </div>
    );
};

export const Route = createFileRoute("/users/$userId/reviews")({
    component: UserReviews,
    loader: ({ params }) =>
        queryClient.ensureQueryData({
            queryKey: ["users", { userId: params.userId }],
            queryFn: () => getUser(params.userId),
        }),
});
