import { RegistrationForm } from "./RegistrationForm";

export const RegistrationPage = () => {
    return (
        <div className="flex flex-col justify-center items-center 2">
            <h1 tabIndex={-1} className="text-2xl my-10 font-bold text-center">
                Register new account
            </h1>
            <RegistrationForm />
        </div>
    );
};
