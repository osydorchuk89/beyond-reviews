import { createFileRoute } from "@tanstack/react-router";
import { LoginSuccess } from "../components/LoginSuccess";

export const Route = createFileRoute("/login/success")({
    component: LoginSuccess,
});
