import { useSearchParams } from "react-router";

export const useQueryClick = () => {
    const [_, setSearchParams] = useSearchParams();

    const handleQueryClick = (paramType: string, value: string) => {
        setSearchParams((searchParams) => {
            if (paramType === "genre") {
                searchParams.set("genre", value);
            } else if (paramType === "releaseYear") {
                searchParams.set("releaseYear", value);
            }

            searchParams.delete("page");

            return searchParams;
        });
    };

    return handleQueryClick;
};
