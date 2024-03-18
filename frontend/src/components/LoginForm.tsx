import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
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
        <a
            className="flex justify-center items-center relative py-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-200"
            href={`${BASE_URL}auth/google`}
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
        </a>
    );
};

export const LoginForm = () => {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });

    const navigate = useNavigate();

    return (
        <div className="flex justify-center items-center">
            <form
                className="flex flex-col justify-start w-[26rem] bg-amber-100 shadow-lg px-10 pt-8 pb-10 rounded-md gap-5"
                onSubmit={handleSubmit(async (data) => {
                    axios({
                        method: "post",
                        url: BASE_URL + "auth/login",
                        withCredentials: true,
                        data,
                    })
                        .then(() => {
                            navigate("/");
                        })
                        .catch((error) => {
                            if (error.response.status === 500) {
                                setError("email", {
                                    type: "custom",
                                    message: "Incorrect username or password",
                                });
                                setError("password", {
                                    type: "custom",
                                    message: "Incorrect username or password",
                                });
                            } else {
                                console.log(error);
                            }
                        });
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
                </div>
                <div className="flex justify-center">
                    <DarkButton type="submit" text="LOGIN" />
                </div>
                <p className="text-center">
                    Don't have an account?{" "}
                    <DarkLink text="Register here" link="/registration" />
                </p>
                <p className="w-full text-center border-b-2 border-amber-950 leading-[0.1rem] my-5">
                    <span className="bg-amber-100 px-2">or</span>
                </p>
                <SocialLoginButton />
            </form>
        </div>
    );
};