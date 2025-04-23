import { RegistrationForm } from "./RegistrationForm";

export const RegistrationPage = () => {
    return (
        <div className="flex flex-col justify-center items-center 2">
            <p className="text-2xl my-10 font-bold text-center">
                Register new account
            </p>
            <RegistrationForm />
        </div>
    );
};
