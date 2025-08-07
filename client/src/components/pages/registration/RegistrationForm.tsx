import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { UserSchema } from "../../../lib/schemas";
import { BaseButton } from "../../ui/BaseButton";
import { sendRegistrationData } from "../../../lib/actions";

export type RegistrationInputs = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photo?: File[];
};

export const RegistrationForm = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegistrationInputs>({
        resolver: zodResolver(UserSchema),
    });

    const handleRegistration = handleSubmit(async (data) => {
        const registrationData = new FormData();
        registrationData.append("firstName", data.firstName);
        registrationData.append("lastName", data.lastName);
        registrationData.append("email", data.email);
        registrationData.append("password", data.password);
        data.photo && registrationData.append("photo", data.photo[0]);

        try {
            await sendRegistrationData(registrationData);
            navigate("/movies");
        } catch (error: any) {
            if (error.response.status === 409) {
                setError("email", {
                    type: "custom",
                    message: "User with this email already exists",
                });
            } else {
                console.log(error);
            }
        }
    });

    return (
        <form
            noValidate
            className="flex flex-col justify-start w-[36rem] px-5 pt-5 pb-10 gap-5"
            onSubmit={handleRegistration}
        >
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
                <BaseButton type="submit" style="sky" text="REGISTER" />
            </div>
        </form>
    );
};
