import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/LoginForm";
import { z } from "zod";

const redirectSchema = z.object({
    redirect: z.string().optional().catch(""),
});

const Login = () => {
    return (
        <div className="flex flex-col justify-center items-center py-10">
            <LoginForm />
        </div>
    );
};

export const Route = createFileRoute("/login/")({
    component: Login,
    validateSearch: redirectSchema,
});
