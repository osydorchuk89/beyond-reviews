import { FilterTag } from "./FilterTag";

interface MoviesFiltersProps {
    filters: string[];
    handleCloseFilterTag: (filter: string) => void;
}

export const MoviesFilters = ({
    filters,
    handleCloseFilterTag,
}: MoviesFiltersProps) => {
    return (
        <ul className="flex flex-row justify-center gap-4">
            {filters.map((filter) => (
                <FilterTag
                    key={filter}
                    filter={filter}
                    onRemoveFilter={handleCloseFilterTag}
                />
            ))}
        </ul>
    );
};
