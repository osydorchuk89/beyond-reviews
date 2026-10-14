import { useId } from "react";
import { useSearchParams } from "react-router";
import { useForm, type SubmitHandler } from "react-hook-form";

import { BaseButton } from "../../ui/BaseButton";
import { CloseIcon } from "../../icons/CloseIcon";

interface SearchInput {
    title: string;
}

interface SearchBarProps {
    placeholder?: string;
}

export const SearchBar = ({
    placeholder = "enter movie title",
}: SearchBarProps) => {
    const inputId = useId();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get("search");

    const {
        register,
        handleSubmit,
        reset,
        setFocus,
        formState: { errors },
    } = useForm<SearchInput>();

    const onSubmit: SubmitHandler<SearchInput> = (data) => {
        setSearchParams((searchParams) => {
            searchParams.set("search", data.title.trim());
            return searchParams;
        });
        reset();
    };

    const handleCloseSearchTag = () => {
        setSearchParams((searchParams) => {
            searchParams.delete("search");
            return searchParams;
        });
        setFocus("title");
    };

    return (
        <search
            aria-label="Catalog search"
            className="flex flex-col justify-between bg-sky-100 rounded-md shadow-md overflow-hidden"
        >
            <label
                htmlFor={inputId}
                className="text-center text-xl font-semibold bg-sky-700 text-sky-50 py-2"
            >
                Search
            </label>
            <form
                noValidate
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col justify-center lg:gap-3 px-5 py-3"
            >
                <div className="relative">
                    <input
                        {...register("title", {
                            validate: (value) =>
                                value.trim().length > 0 ||
                                "Enter a title to search.",
                        })}
                        id={inputId}
                        aria-invalid={Boolean(errors.title)}
                        aria-describedby={
                            errors.title ? `${inputId}-error` : undefined
                        }
                        className="w-full rounded-md border border-gray-700 py-2 pr-20 pl-3 focus:border-orange-900 lg:pr-3"
                        placeholder={placeholder}
                        type="text"
                    />
                    <div className="absolute top-1/2 right-1 -translate-y-1/2 lg:hidden">
                        <BaseButton style="inline" type="submit">
                            Search
                        </BaseButton>
                    </div>
                </div>
                {errors.title && (
                    <p
                        id={`${inputId}-error`}
                        role="alert"
                        className="text-red-800"
                    >
                        {errors.title.message}
                    </p>
                )}
                <div className="flex justify-center gap-2 w-full lg:justify-start">
                    <div className="hidden lg:block">
                        <BaseButton style="orange" type="submit">
                            Search
                        </BaseButton>
                    </div>
                    {searchTerm && searchTerm !== "" && (
                        <div className="flex items-center gap-2 bg-orange-300 rounded-md text-orange-950 p-2 overflow-hidden">
                            <span className="truncate">{searchTerm}</span>
                            <CloseIcon
                                style="dark"
                                aria-label="Clear search"
                                handleClick={handleCloseSearchTag}
                            />
                        </div>
                    )}
                </div>
            </form>
        </search>
    );
};
