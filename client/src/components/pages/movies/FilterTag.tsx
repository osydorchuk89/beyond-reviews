import { CloseIcon } from "../../icons/CloseIcon";

interface FilterTagProps {
    filter: string;
    onRemoveFilter: (filter: string) => void;
}

export const FilterTag = ({ filter, onRemoveFilter }: FilterTagProps) => {
    return (
        <li className="flex min-w-0 max-w-full gap-4 items-center pl-4 pr-2 py-2 mb-8 bg-orange-300 rounded-md">
            <span className="min-w-0 text-orange-950 text-xl text-center leading-6">
                {filter}
            </span>
            <CloseIcon
                style="dark"
                aria-label={`Remove ${filter}`}
                handleClick={() => {
                    // This tag disappears. The search field remains mounted while results load.
                    document
                        .querySelector<HTMLInputElement>(
                            'search[aria-label="Catalog search"] input',
                        )
                        ?.focus();
                    onRemoveFilter(filter);
                }}
            />
        </li>
    );
};
