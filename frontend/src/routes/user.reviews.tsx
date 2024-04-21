import { createFileRoute } from "@tanstack/react-router";
import { UserReviews } from "../components/UserReviews";
import { isAuthenticated } from "../lib/auth";

export const Route = createFileRoute("/user/reviews")({
    component: UserReviews,
    beforeLoad: isAuthenticated,
});
