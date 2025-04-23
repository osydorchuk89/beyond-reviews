import { createSearchParams, useNavigate } from "react-router";

export const useQueryClick = () => {
    const navigate = useNavigate();

    const handleQueryClick = (filteredBy: string, value: string) =>
        navigate({
            pathname: "/movies",
            search: createSearchParams({
                filter: `${filteredBy}-${value}`,
            }).toString(),
        });

    return handleQueryClick;
};
