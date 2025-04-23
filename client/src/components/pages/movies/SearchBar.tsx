import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "../../ui/Button";
import { CloseIcon } from "../../icons/CloseIcon";
import { useSearchParams } from "react-router";

interface SearchInput {
    title: string;
}

export const SearchBar = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchTerm = searchParams.get("search");

    const { register, handleSubmit, reset } = useForm<SearchInput>();

    const onSubmit: SubmitHandler<SearchInput> = (data) => {
        setSearchParams((searchParams) => {
            searchParams.set("search", data.title);
            return searchParams;
        });
        reset();
    };

    const handleCloseSearchTag = () => {
        setSearchParams((searchParams) => {
            searchParams.delete("search");
            return searchParams;
        });
    };

    return (
        <div className="flex flex-col justify-between bg-sky-100 rounded-md shadow-md overflow-hidden">
            <p className="text-center text-xl font-semibold bg-sky-700 text-sky-50 py-2">
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
                    className="w-full border border-gray-700 rounded-md px-3 py-2 focus:border-orange-900"
                    placeholder="enter movie title"
                    type="text"
                />
                <div className="flex justify-center md:justify-start gap-2 w-full">
                    <Button style="orange" text="Search" type="submit" />
                    {searchTerm && searchTerm !== "" && (
                        <div className="flex items-center gap-2 bg-orange-300 rounded-md text-orange-950 p-2 overflow-hidden">
                            <span className="truncate">{searchTerm}</span>
                            <CloseIcon handleClick={handleCloseSearchTag} />
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};
