import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "./Button";
import { CloseIcon } from "./icons/CloseIcon";

interface SearchInput {
    title: string;
}

export const SearchBar = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const { register, handleSubmit, reset } = useForm<SearchInput>();

    const onSubmit: SubmitHandler<SearchInput> = (data) => {
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
        <div className="flex flex-col justify-between bg-amber-100 rounded-md shadow-md overflow-hidden">
            <p className="text-center text-xl font-bold bg-amber-700 text-amber-50 py-2">
                Search
            </p>
            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col justify-center gap-3 py-3 px-5"
            >
                <input
                    {...register("title", {
                        required: true,
                    })}
                    className="w-full border border-gray-700 rounded-md px-3 py-2 focus:border-amber-900"
                    placeholder="enter movie title"
                    type="text"
                />
                <div className="flex justify-start gap-2 w-full">
                    <Button style="dark" text="Search" type="submit" />
                    {searchTerm && (
                        <div className="flex items-center gap-2 bg-amber-300 rounded-md text-amber-950 font-bold p-2 overflow-hidden">
                            <span className="truncate">{searchTerm}</span>
                            <CloseIcon
                                className="w-5 h-5 cursor-pointer flex-none"
                                handleClick={handleCloseSearchTag}
                            />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};
