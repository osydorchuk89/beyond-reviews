import { useRef } from "react";
import type { SearchItem } from "../../../lib/entities";
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
    const buttonRef = useRef<HTMLButtonElement>(null);
    return (
        <li
            className={`w-full flex relative items-center gap-2 text-orange-950 px-2 rounded-md ${
                isItemActive(item)
                    ? " bg-orange-300 hover:bg-orange-300"
                    : " hover:bg-orange-200"
            }`}
        >
            <button
                ref={buttonRef}
                type="button"
                aria-pressed={isItemActive(item)}
                className="w-full py-2 cursor-pointer"
                onClick={() => handleItemClick(item)}
            >
                {item.text}
            </button>
            {isItemActive(item) && (
                <div className="absolute top-2 right-2">
                    <CloseIcon
                        style="dark"
                        aria-label={`Clear ${item.text}`}
                        handleClick={() => {
                            buttonRef.current?.focus();
                            handleCancelSortFilter(item.type);
                        }}
                    />
                </div>
            )}
        </li>
    );
};
