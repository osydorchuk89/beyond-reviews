import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useActionData, useNavigation, useSubmit } from "react-router";

import { UserSchema } from "../../../lib/schemas";
import { BaseButton } from "../../ui/BaseButton";
import type { RegistrationInputs } from "../../../lib/entities";

export const RegistrationForm = () => {
    const actionData = useActionData() as
        | { error?: string; field?: "email" }
        | undefined;
    const saveRef = useRef<HTMLButtonElement>(null);
    const navigation = useNavigation();
    const submit = useSubmit();
    const isSubmitting =
        navigation.state !== "idle" &&
        navigation.formAction === "/registration";

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegistrationInputs>({
        resolver: zodResolver(UserSchema),
    });

    const onSubmit = (data: RegistrationInputs) => {
        if (isSubmitting) return;
        saveRef.current?.focus({ preventScroll: true });
        const formData = new FormData();
        formData.append("firstName", data.firstName);
        formData.append("lastName", data.lastName);
        formData.append("email", data.email);
        formData.append("password", data.password);
        if (data.photo?.[0]) {
            formData.append("photo", data.photo[0]);
        }
        submit(formData, {
            method: "post",
            encType: "multipart/form-data",
        });
    };

    useEffect(() => {
        if (actionData?.error && actionData.field === "email") {
            setError(
                "email",
                {
                    type: "server",
                    message: actionData.error,
                },
                { shouldFocus: true },
            );
        }
    }, [actionData, setError]);

    return (
        <Form
            noValidate
            encType="multipart/form-data"
            className="flex flex-col justify-start w-[36rem] max-w-full px-5 pt-5 pb-10 gap-5"
            onSubmit={handleSubmit(onSubmit)}
        >
            {!isSubmitting &&
                actionData?.error &&
                actionData.field !== "email" && (
                    <p
                        role="alert"
                        className="text-red-700 font-medium text-center"
                    >
                        {actionData.error}
                    </p>
                )}
            <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="font-semibold">
                    First Name:
                </label>
                <input
                    {...register("firstName")}
                    className="min-w-0 max-w-full border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="text"
                    id="firstName"
                    placeholder="Jane"
                    autoComplete="given-name"
                    required
                    readOnly={isSubmitting}
                    aria-invalid={Boolean(errors.firstName)}
                    aria-describedby={
                        errors.firstName
                            ? "registration-firstName-error"
                            : undefined
                    }
                />
                <p
                    id="registration-firstName-error"
                    className="text-red-700 font-medium"
                >
                    {errors.firstName?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="font-semibold">
                    Last Name:
                </label>
                <input
                    {...register("lastName")}
                    className="min-w-0 max-w-full border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="text"
                    id="lastName"
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                    readOnly={isSubmitting}
                    aria-invalid={Boolean(errors.lastName)}
                    aria-describedby={
                        errors.lastName
                            ? "registration-lastName-error"
                            : undefined
                    }
                />
                <p
                    id="registration-lastName-error"
                    className="text-red-700 font-medium"
                >
                    {errors.lastName?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-semibold">
                    Email:
                </label>
                <input
                    {...register("email")}
                    className="min-w-0 max-w-full border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="email"
                    id="email"
                    placeholder="jane.doe@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    readOnly={isSubmitting}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                        errors.email ? "registration-email-error" : undefined
                    }
                />
                <p
                    id="registration-email-error"
                    className="text-red-700 font-medium"
                >
                    {errors.email?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-semibold">
                    Password:
                </label>
                <input
                    {...register("password")}
                    className="min-w-0 max-w-full border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="password"
                    id="password"
                    placeholder="password"
                    autoComplete="new-password"
                    required
                    readOnly={isSubmitting}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={`registration-password-hint${errors.password ? " registration-password-error" : ""}`}
                />
                <p id="registration-password-hint" className="sr-only">
                    Use at least eight characters.
                </p>
                <p
                    id="registration-password-error"
                    className="text-red-700 font-medium"
                >
                    {errors.password?.message}
                </p>
            </div>
            <div className="flex flex-col gap-3 mb-5">
                <label htmlFor="photo" className="font-semibold">
                    Photo (optional):
                </label>
                <input
                    {...register("photo")}
                    className="min-w-0 max-w-full w-fit file:border-none file:px-4 file:py-2 file:rounded-md file:text-orange-950 file:bg-orange-200 active:file:bg-orange-400 hover:file:cursor-pointer"
                    type="file"
                    id="photo"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.photo)}
                    aria-describedby={`registration-photo-hint${errors.photo ? " registration-photo-error" : ""}`}
                />
                <p id="registration-photo-hint" className="sr-only">
                    JPEG, PNG, or WebP. Maximum file size: 5 MiB.
                </p>
                <p
                    id="registration-photo-error"
                    className="text-red-700 font-medium"
                >
                    {errors.photo?.message}
                </p>
            </div>
            {Object.keys(errors).length > 0 && (
                <p role="alert" className="sr-only">
                    Please correct the fields above.
                </p>
            )}
            <div className="flex justify-center">
                <BaseButton
                    ref={saveRef}
                    type="submit"
                    style="sky"
                    aria-disabled={isSubmitting}
                >
                    {isSubmitting ? "Please wait..." : "REGISTER"}
                </BaseButton>
            </div>
            <p role="status" aria-atomic="true" className="sr-only">
                {isSubmitting ? "Creating your account…" : ""}
            </p>
        </Form>
    );
};
