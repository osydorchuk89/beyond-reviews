import axios from "axios";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema } from "../lib/schemas";
import { Button } from "./Button";
import { BASE_API_URL } from "../lib/urls";

type RegistrationInputs = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
};

export const RegistrationForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
    } = useForm<RegistrationInputs>({
        resolver: zodResolver(UserSchema),
    });

    const sendRegistrationFormData = async (data: RegistrationInputs) => {
        try {
            await axios({
                method: "post",
                url: BASE_API_URL + "users/",
                data,
            });
            navigate({ to: "/" });
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
    };

    const { mutate } = useMutation({
        mutationFn: sendRegistrationFormData,
    });

    const navigate = useNavigate();

    return (
        <form
            noValidate
            className="flex flex-col justify-start w-[36rem] px-5 pt-5 pb-10 gap-5"
            onSubmit={handleSubmit((data) => {
                mutate(data);
            })}
        >
            <div className="flex flex-col gap-2">
                <label htmlFor="firstName">First Name:</label>
                <input
                    {...register("firstName")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="text"
                    id="firstName"
                    placeholder="Jane"
                />
                <p>{errors.firstName?.message}</p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="lastName">Last Name:</label>
                <input
                    {...register("lastName")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="text"
                    id="lastName"
                    placeholder="Doe"
                />
                <p>{errors.lastName?.message}</p>
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="email">Email:</label>
                <input
                    {...register("email")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="email"
                    id="email"
                    placeholder="jane.doe@email.com"
                />
                <p>{errors.email?.message}</p>
            </div>
            <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="password">Password:</label>
                <input
                    {...register("password")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="password"
                    id="password"
                    placeholder="password"
                />
                <p>{errors.password?.message}</p>
            </div>
            <div className="flex justify-center">
                <Button type="submit" style="dark" text="REGISTER" />
            </div>
        </form>
    );
};
