import { CloseIcon } from "../../icons/CloseIcon";

interface FilterTagsProps {
    filters: string[];
    onRemoveFilter: (filter: string) => void;
}

export const FilterTags = ({ filters, onRemoveFilter }: FilterTagsProps) => {
    return (
        <ul className="flex flex-row justify-center gap-4">
            {filters.map((filter) => (
                <li
                    key={filter}
                    className="flex gap-4 items-center w-fit self-center px-4 py-3 mb-8 bg-orange-300 rounded-md"
                >
                    <span className="text-orange-950 text-xl text-center leading-0">
                        {filter}
                    </span>
                    <CloseIcon handleClick={() => onRemoveFilter(filter)} />
                </li>
            ))}
        </ul>
    );
};
