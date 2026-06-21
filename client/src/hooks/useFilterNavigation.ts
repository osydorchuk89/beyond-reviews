import { useNavigate } from "react-router";

export const useFilterNavigation = (basePath = "/movies") => {
    const navigate = useNavigate();

    const handleFilterNavigation = (
        filterType: string,
        filterValue: string,
    ) => {
        navigate(`${basePath}?${filterType}=${encodeURIComponent(filterValue)}`);
    };

    return handleFilterNavigation;
};
