import axios from "axios";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserSchema } from "../lib/schemas";
import { Button } from "./Button";
import { BASE_API_URL } from "../lib/urls";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { infoBarActions } from "../store";

type RegistrationInputs = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    photo: File[];
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

    const { justLoggedIn, justLoggedOut } = useAppSelector(
        (state) => state.infoBar
    );
    const dispatch = useAppDispatch();

    const sendRegistrationFormData = async (data: RegistrationInputs) => {
        const newData = new FormData();
        newData.append("firstName", data.firstName);
        newData.append("lastName", data.lastName);
        newData.append("email", data.email);
        newData.append("password", data.password);
        newData.append("photo", data.photo[0]);
        try {
            await axios({
                method: "post",
                url: BASE_API_URL + "users/",
                headers: {
                    "Content-Type": "multi-part/formdata",
                },
                data: newData,
            });
            navigate({ to: "/" });
            justLoggedIn && dispatch(infoBarActions.hideLoggedInBar());
            justLoggedOut && dispatch(infoBarActions.hideLoggedOutBar());
            dispatch(infoBarActions.showRegisteredBar());
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
                <label htmlFor="firstName" className="font-semibold">
                    First Name:
                </label>
                <input
                    {...register("firstName")}
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
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
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
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
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
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
                    className="border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    type="password"
                    id="password"
                    placeholder="password"
                />
                <p className="text-red-700 font-medium">
                    {errors.password?.message}
                </p>
            </div>
            <div className="flex flex-col gap-2 mb-5">
                <label htmlFor="photo" className="font-semibold">
                    Photo (optional):
                </label>
                <input
                    {...register("photo")}
                    className="w-min file:border-none file:px-4 file:py-2 file:rounded-md file:text-amber-950 file:bg-amber-200 file:active:bg-amber-400 file:hover:cursor-pointer"
                    type="file"
                    id="photo"
                />
                <p className="text-red-700 font-medium">
                    {errors.photo?.message}
                </p>
            </div>
            <div className="flex justify-center">
                <Button type="submit" style="dark" text="REGISTER" />
            </div>
        </form>
    );
};
