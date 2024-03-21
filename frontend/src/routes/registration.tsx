import { createFileRoute } from "@tanstack/react-router";
import { RegistrationForm } from "../components/RegistrationForm";

const Registration = () => {
    return (
        <div className="flex flex-col justify-center items-center 2">
            <p className="text-2xl my-10 font-bold text-center">
                Register new account
            </p>
            <RegistrationForm />
        </div>
    );
};

export const Route = createFileRoute("/registration")({
    component: Registration,
});
