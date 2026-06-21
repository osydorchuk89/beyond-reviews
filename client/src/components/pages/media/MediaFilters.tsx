import { FilterTag } from "../movies/FilterTag";

interface MediaFiltersProps {
    filters: string[];
    handleCloseFilterTag: (filter: string) => void;
}

export const MediaFilters = ({
    filters,
    handleCloseFilterTag,
}: MediaFiltersProps) => {
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
