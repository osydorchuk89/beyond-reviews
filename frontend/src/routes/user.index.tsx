import { createFileRoute } from "@tanstack/react-router";
import { UserMainPage } from "../components/UserMainPage";
import { isAuthenticated } from "../lib/auth";

export const Route = createFileRoute("/user/")({
    component: UserMainPage,
    beforeLoad: isAuthenticated,
});
