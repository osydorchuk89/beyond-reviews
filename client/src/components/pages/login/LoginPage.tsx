import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../../../lib/schemas";
import { Button } from "../../ui/Button";
import { NavLink } from "../../ui/NavLink";
import { SocialLoginButton } from "../../ui/SocialLoginButton";
import { sendLoginData } from "../../../lib/actions";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../../../store/hooks";
import { triggerAuthEvent } from "../../../store";
import { CloseIcon } from "../../icons/CloseIcon";

interface LoginInputs {
    email: string;
    password: string;
}

export const LoginPage = () => {
    const navigate = useNavigate();
    const [fetching, setFetching] = useState(false);
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });

    const dispatch = useAppDispatch();

    const handleLogin = handleSubmit(async (data) => {
        setFetching(true);
        const response = await sendLoginData(data);
        setFetching(false);
        if (response.status === 401) {
            setInvalidCredentials(true);
        }
        if (response.status === 200) {
            setInvalidCredentials(false);
            dispatch(triggerAuthEvent("loggedIn"));
            navigate(-1);
        }
    });

    return (
        <div className="flex flex-col justify-center items-center py-10 h-[720px]">
            <div className="flex flex-col justify-center items-center">
                {invalidCredentials && (
                    <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-5 rounded absolute top-[120px]">
                        <span className="block sm:inline">
                            Invalid credentials
                        </span>
                        <button
                            className="ml-3"
                            onClick={() => setInvalidCredentials(false)}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                )}
                <form
                    noValidate
                    className="flex flex-col justify-start md:w-[26rem] bg-sky-100 shadow-lg px-10 pt-8 pb-10 rounded-md gap-5"
                    onSubmit={handleLogin}
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
                    <Button
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
            </div>
        </div>
    );
};
