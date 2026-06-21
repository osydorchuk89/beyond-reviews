import { MediaFilters } from "../media/MediaFilters";

interface MoviesFiltersProps {
    filters: string[];
    handleCloseFilterTag: (filter: string) => void;
}

export const MoviesFilters = ({
    filters,
    handleCloseFilterTag,
}: MoviesFiltersProps) => {
    return (
        <MediaFilters
            filters={filters}
            handleCloseFilterTag={handleCloseFilterTag}
        />
    );
};
