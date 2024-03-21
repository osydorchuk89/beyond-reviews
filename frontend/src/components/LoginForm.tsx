import axios from "axios";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAppDispatch } from "../store/hooks";
import { authActions } from "../store";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "../lib/schemas";
import { DarkLink } from "./DarkLink";
import { DarkButton } from "./DarkButton";
import { BASE_URL } from "../lib/urls";

type LoginInputs = {
    email: string;
    password: string;
};

const SocialLoginButton = () => {
    return (
        <button
            className="flex justify-center items-center relative py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-200"
            type="button"
            onClick={() => {
                location.href = BASE_URL + "auth/google";
                // axios({
                //     method: "get",
                //     url: BASE_URL + "auth/google/callback",
                // }).then((res) => console.log(res));
            }}
            // href={`${BASE_URL}auth/google`}
        >
            <div className="absolute left-3">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    width="24"
                    height="24"
                    viewBox="0 0 48 48"
                >
                    <path
                        fill="#FFC107"
                        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                    <path
                        fill="#FF3D00"
                        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    ></path>
                    <path
                        fill="#4CAF50"
                        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    ></path>
                    <path
                        fill="#1976D2"
                        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                </svg>
            </div>
            <div>
                <p className="text-xl">Login with Google </p>
            </div>
        </button>
    );
};

export const LoginForm = () => {
    const [invalidCredentials, setInvalidCredentials] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });

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
            navigate({ to: "/" });
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

    const navigate = useNavigate();

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
                        name="email"
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
                        name="password"
                        placeholder="password"
                    />
                    <p>{errors.password?.message}</p>
                    {/* {invalidCredentials && (
                        <p className="self-center w-fit bg-red-800 text-red-50 my-2 py-2 px-5 rounded-md">
                            Incorrect username or password
                        </p>
                    )} */}
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
