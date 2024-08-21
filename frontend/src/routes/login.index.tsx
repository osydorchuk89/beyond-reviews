import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/loginPage/LoginForm";
import { z } from "zod";

const redirectSchema = z.object({
    redirect: z.string().optional().catch(""),
});

export const Route = createFileRoute("/login/")({
    component: LoginForm,
    validateSearch: redirectSchema,
});
