import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { LoginSchema } from "../../../lib/schemas";
import { BaseButton } from "../../ui/BaseButton";
import { NavLink } from "../../ui/NavLink";
import { SocialLoginButton } from "../../ui/SocialLoginButton";
import { LoginInputs } from "../../../lib/entities";

interface LoginFormProps {
    onSubmit: (data: LoginInputs) => Promise<void>;
    fetching: boolean;
}

export const LoginForm = ({ onSubmit, fetching }: LoginFormProps) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });

    const handleFormSubmit = handleSubmit(async (data) => {
        await onSubmit(data);
    });

    return (
        <form
            noValidate
            className="flex flex-col justify-start md:w-[26rem] bg-sky-100 shadow-lg px-10 pt-8 pb-10 rounded-md gap-5"
            onSubmit={handleFormSubmit}
            data-testid="login-form"
        >
            <p className="text-2xl font-bold text-center">
                Login to your account
            </p>

            <div className="flex flex-col gap-2">
                <label htmlFor="email">Email:</label>
                <input
                    {...register("email")}
                    className="bg-white border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                />
                <p className="text-red-700 font-medium">
                    {errors.email?.message}
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor="password">Password:</label>
                <input
                    {...register("password")}
                    className="bg-white border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="password"
                    id="password"
                    placeholder="password"
                />
                <p className="text-red-700 font-medium">
                    {errors.password?.message}
                </p>
            </div>

            <BaseButton
                type="submit"
                style="orange"
                text={fetching ? "Please wait..." : "LOGIN"}
                disabled={fetching}
            />

            <p className="text-center">
                Don't have an account?{" "}
                <span className="font-medium">
                    <NavLink text="Register here" to="/registration" />
                </span>
            </p>

            <p className="w-full text-center border-b-2 border-amber-950 leading-[0.1rem] my-5">
                <span className="bg-sky-100 px-2">or</span>
            </p>
            <SocialLoginButton />
        </form>
    );
};
