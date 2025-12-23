import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, useActionData, useNavigation, useSubmit } from "react-router";

import { UserSchema } from "../../../lib/schemas";
import { BaseButton } from "../../ui/BaseButton";
import { RegistrationInputs } from "../../../lib/entities";

export const RegistrationForm = () => {
    const actionData = useActionData() as { error?: string } | undefined;
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
        const formData = new FormData();
        formData.append("firstName", data.firstName);
        formData.append("lastName", data.lastName);
        formData.append("email", data.email);
        formData.append("password", data.password);
        if (data.photo && data.photo[0]) {
            formData.append("photo", data.photo[0]);
        }
        submit(formData, { method: "post" });
    };

    // Show email error if returned from action
    if (
        actionData?.error &&
        actionData.error.includes("email already exists")
    ) {
        if (!errors.email) {
            setError("email", {
                type: "custom",
                message: actionData.error,
            });
        }
    }

    return (
        <Form
            noValidate
            className="flex flex-col justify-start w-[36rem] px-5 pt-5 pb-10 gap-5"
            onSubmit={handleSubmit(onSubmit)}
        >
            {actionData?.error && !actionData.error.includes("email") && (
                <p className="text-red-700 font-medium text-center">
                    {actionData.error}
                </p>
            )}
            <div className="flex flex-col gap-2">
                <label htmlFor="firstName" className="font-semibold">
                    First Name:
                </label>
                <input
                    {...register("firstName")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="text"
                    id="firstName"
                    placeholder="Jane"
                />
                <p className="text-red-700 font-medium">
                    {errors.firstName?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="lastName" className="font-semibold">
                    Last Name:
                </label>
                <input
                    {...register("lastName")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="text"
                    id="lastName"
                    placeholder="Doe"
                />
                <p className="text-red-700 font-medium">
                    {errors.lastName?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-semibold">
                    Email:
                </label>
                <input
                    {...register("email")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="email"
                    id="email"
                    placeholder="jane.doe@email.com"
                />
                <p className="text-red-700 font-medium">
                    {errors.email?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="password" className="font-semibold">
                    Password:
                </label>
                <input
                    {...register("password")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    type="password"
                    id="password"
                    placeholder="password"
                />
                <p className="text-red-700 font-medium">
                    {errors.password?.message}
                </p>
            </div>
            <div className="flex flex-col gap-3 mb-5">
                <label htmlFor="photo" className="font-semibold">
                    Photo (optional):
                </label>
                <input
                    {...register("photo")}
                    className="w-fit file:border-none file:px-4 file:py-2 file:rounded-md file:text-orange-950 file:bg-orange-200 active:file:bg-orange-400 hover:file:cursor-pointer"
                    type="file"
                    id="photo"
                />
                <p className="text-red-700 font-medium">
                    {errors.photo?.message}
                </p>
            </div>
            <div className="flex justify-center">
                <BaseButton type="submit" style="sky" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : "REGISTER"}
                </BaseButton>
            </div>
        </Form>
    );
};
