import { createLazyFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/LoginForm";

const Login = () => {
    return (
        <div className="flex flex-col justify-center items-center py-10">
            <LoginForm />
        </div>
    );
};

export const Route = createLazyFileRoute("/login/")({
    component: Login,
});
