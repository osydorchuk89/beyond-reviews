import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "./Button";
import { CloseIcon } from "./CloseIcon";

interface SearchInputs {
    title: string;
}

export const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const { register, handleSubmit, reset } = useForm<SearchInputs>();

    const onSubmit: SubmitHandler<SearchInputs> = (data) => {
        navigate({
            search: (prevState) => ({ ...prevState, search: data.title }),
        });
        setSearchTerm(data.title);
        reset();
    };

    const handleCloseSearchTag = () => {
        setSearchTerm("");
        navigate({
            search: (prevState) => ({ ...prevState, search: "" }),
        });
    };

    return (
        <div className="flex flex-col justify-between bg-amber-100 rounded-md m-5 overflow-hidden">
            <p className="text-center text-xl font-bold bg-amber-700 text-amber-50 py-2">
                Search
            </p>
            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="flex justify-center items-center gap-10 py-5"
            >
                <div className="flex flex-col">
                    <input
                        {...register("title", {
                            required: true,
                        })}
                        className="w-[440px] border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                        placeholder="enter movie title"
                        type="text"
                    />
                </div>
                <Button style="dark" text="Search" type="submit" />
            </form>
            {searchTerm && (
                <div className="flex justify-center pb-5">
                    <div className="flex items-center gap-2 bg-amber-300 rounded-md text-amber-950 font-bold p-2">
                        {searchTerm}
                        <CloseIcon
                            className="w-5 h-5 cursor-pointer"
                            handleClick={handleCloseSearchTag}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
