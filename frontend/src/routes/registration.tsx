import { createFileRoute } from "@tanstack/react-router";
import { Registration } from "../components/registrationPage/Registration";
import { redirectIfAuthenticated } from "../lib/auth";

export const Route = createFileRoute("/registration")({
    component: Registration,
    beforeLoad: redirectIfAuthenticated,
});
