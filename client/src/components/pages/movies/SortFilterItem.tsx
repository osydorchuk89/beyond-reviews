import { SearchItem } from "../../../lib/entities";
import { CloseIcon } from "../../icons/CloseIcon";

interface SortFilterItemProps {
    item: SearchItem;
    isItemActive: (item: SearchItem) => boolean;
    handleItemClick: (item: SearchItem) => void;
    handleCancelSortFilter: (type: string) => void;
}

export const SortFilterItem = ({
    item,
    isItemActive,
    handleItemClick,
    handleCancelSortFilter,
}: SortFilterItemProps) => {
    return (
        <li
            className={`flex relative items-center gap-2 text-orange-950 px-2 rounded-md ${
                isItemActive(item)
                    ? " bg-orange-300 hover:bg-orange-300"
                    : " hover:bg-orange-200"
            }`}
        >
            <button
                className="w-full py-2 cursor-pointer"
                onClick={() => handleItemClick(item)}
            >
                {item.text}
            </button>
            {isItemActive(item) && (
                <div className="absolute top-2 right-2">
                    <CloseIcon
                        handleClick={() => handleCancelSortFilter(item.type)}
                    />
                </div>
            )}
        </li>
    );
};
