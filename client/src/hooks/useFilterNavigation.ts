import { useNavigate } from "react-router";

export const useFilterNavigation = () => {
    const navigate = useNavigate();

    const handleFilterNavigation = (
        filterType: string,
        filterValue: string,
    ) => {
        navigate(`/movies?${filterType}=${encodeURIComponent(filterValue)}`);
    };

    return handleFilterNavigation;
};
