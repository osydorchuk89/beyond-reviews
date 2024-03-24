import axios from "axios";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch } from "../store/hooks";
import { authActions } from "../store";
import { LoginSchema } from "../lib/schemas";
import { DarkLink } from "./DarkLink";
import { DarkButton } from "./DarkButton";
import { SocialLoginButton } from "./SocialLoginButton";
import { BASE_URL } from "../lib/urls";

interface LoginInputs {
    email: string;
    password: string;
}

export const LoginForm = () => {
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });
    const { history } = useRouter();

    const sendLoginFormData = async (data: LoginInputs) => {
        try {
            const response = await axios({
                method: "post",
                url: BASE_URL + "auth/login",
                withCredentials: true,
                data,
            });
            setInvalidCredentials(false);
            dispatch(authActions.login(response.data));
            history.back();
        } catch (error: any) {
            if (error.response.status === 500) {
                setInvalidCredentials(true);
            } else {
                console.log(error);
            }
        }
    };

    const { mutate } = useMutation({
        mutationFn: sendLoginFormData,
    });

    const dispatch = useAppDispatch();

    return (
        <div className="flex flex-col justify-center items-center">
            {invalidCredentials && (
                <div
                    className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-5 rounded"
                    role="alert"
                >
                    <span className="block sm:inline">Invalid credentials</span>
                    <button
                        className="ml-3"
                        onClick={() => setInvalidCredentials(false)}
                    >
                        <svg
                            className="fill-current h-6 w-6 text-red-500"
                            role="button"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                        >
                            <title>Close</title>
                            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
                        </svg>
                    </button>
                </div>
            )}
            <form
                noValidate
                className="flex flex-col justify-start w-[26rem] bg-amber-100 shadow-lg px-10 pt-8 pb-10 rounded-md gap-5"
                onSubmit={handleSubmit((data) => {
                    mutate(data);
                })}
            >
                <p className="text-2xl font-bold text-center">
                    Login to your account
                </p>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email">Email:</label>
                    <input
                        {...register("email")}
                        className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                        type="email"
                        id="email"
                        // name="email"
                        placeholder="your@email.com"
                    />
                    <p>{errors.email?.message}</p>
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password">Password:</label>
                    <input
                        {...register("password")}
                        className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                        type="password"
                        id="password"
                        // name="password"
                        placeholder="password"
                    />
                    <p>{errors.password?.message}</p>
                </div>
                <div className="flex justify-center">
                    <DarkButton type="submit" text="LOGIN" />
                </div>
                <p className="text-center">
                    Don't have an account?{" "}
                    <DarkLink text="Register here" to="/registration" />
                </p>
                <p className="w-full text-center border-b-2 border-amber-950 leading-[0.1rem] my-5">
                    <span className="bg-amber-100 px-2">or</span>
                </p>
                <SocialLoginButton />
            </form>
        </div>
    );
};
