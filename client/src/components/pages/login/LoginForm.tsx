import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    type Location,
    useLocation,
    useNavigation,
    useSubmit,
} from "react-router";

import { LoginSchema } from "../../../lib/schemas";
import { BaseButton } from "../../ui/BaseButton";
import { BaseLink } from "../../ui/BaseLink";
import { SocialLoginButton } from "../../ui/SocialLoginButton";
import type { LocationState, LoginInputs } from "../../../lib/entities";

export const LoginForm = () => {
    const navigation = useNavigation();
    const submit = useSubmit();
    const loginPending =
        navigation.state !== "idle" && navigation.formAction === "/login";

    const location = useLocation() as Location<LocationState>;
    // A failed form action can clear location.state. Keep the original return
    // page through retries so users can continue the task that led to sign-in.
    const from = useRef(location.state?.from ?? "/").current;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInputs>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = (data: LoginInputs) => {
        if (loginPending) return;
        submit(
            {
                email: data.email,
                password: data.password,
                from,
            },
            { method: "post" },
        );
    };

    return (
        <Form
            noValidate
            className="flex flex-col justify-start md:w-[26rem] bg-sky-100 shadow-lg px-10 pt-8 pb-10 rounded-md gap-5"
            onSubmit={handleSubmit(onSubmit)}
            data-testid="login-form"
        >
            <h1 tabIndex={-1} className="text-2xl font-bold text-center">
                Login to your account
            </h1>

            <div className="flex flex-col gap-2">
                <label htmlFor="email">Email:</label>
                <input
                    {...register("email")}
                    className="bg-white border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    readOnly={loginPending}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                        errors.email ? "login-email-error" : undefined
                    }
                />
                <p id="login-email-error" className="text-red-700 font-medium">
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
                    autoComplete="current-password"
                    required
                    readOnly={loginPending}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={
                        errors.password ? "login-password-error" : undefined
                    }
                />
                <p
                    id="login-password-error"
                    className="text-red-700 font-medium"
                >
                    {errors.password?.message}
                </p>
            </div>

            {Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    Please correct the fields above.
                </p>
            )}
            <BaseButton
                type="submit"
                style="orange"
                aria-disabled={loginPending}
            >
                {loginPending ? "Please wait..." : "LOGIN"}
            </BaseButton>
            <p role="status" aria-atomic="true" className="sr-only">
                {loginPending ? "Signing in…" : ""}
            </p>

            <p className="text-center">
                Don't have an account?{" "}
                <span className="font-medium">
                    <BaseLink to="/registration">Register here</BaseLink>
                </span>
            </p>

            <p className="w-full text-center border-b-2 border-amber-950 leading-[0.1rem] my-5">
                <span className="bg-sky-100 px-2">or</span>
            </p>
            <SocialLoginButton />
        </Form>
    );
};
