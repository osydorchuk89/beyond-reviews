import { useSearchParams } from "react-router";

import { SearchItem } from "../../../lib/entities";
import { SortFilterItem } from "./SortFilterItem";

interface SortFilterProps {
    itemsList: SearchItem[];
    title: string;
}

export const SortFilterBar = ({ itemsList, title }: SortFilterProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const genre = searchParams.get("genre");
    const releaseYear = searchParams.get("releaseYear");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");

    const handleItemClick = (item: SearchItem) => {
        setSearchParams((searchParams) => {
            if (item.type === "sortBy") {
                searchParams.set("sortBy", item.value);
                searchParams.set("sortOrder", item.sortOrder ?? "desc");
            } else {
                searchParams.set(item.type, item.value);
            }
            searchParams.delete("page");
            return searchParams;
        });
    };

    const isItemActive = (item: SearchItem) => {
        if (item.type === "sortBy") {
            return sortBy === item.value && sortOrder === item.sortOrder;
        } else if (item.type === "genre") {
            return genre === item.value;
        } else if (item.type === "releaseYear") {
            return releaseYear === item.value;
        }
        return false;
    };

    const handleCancelSortFilter = (type: string) => {
        setSearchParams((searchParams) => {
            if (type === "sortBy") {
                searchParams.delete("sortBy");
                searchParams.delete("sortOrder");
            } else {
                searchParams.delete(type);
            }
            searchParams.delete("page");
            return searchParams;
        });
    };

    return (
        <div className="flex flex-col rounded-md shadow-md bg-sky-100 overflow-hidden">
            <p className="bg-sky-700 text-sky-50 text-center text-xl font-bold py-2 mb-2">
                {title}
            </p>
            <ul className="flex flex-col justify-between font-bold px-5 py-2 items-center md:items-stretch">
                {itemsList.map((item) => (
                    <SortFilterItem
                        key={`${item.value}-${item.sortOrder ?? ""}`}
                        item={item}
                        isItemActive={isItemActive}
                        handleItemClick={handleItemClick}
                        handleCancelSortFilter={handleCancelSortFilter}
                    />
                ))}
            </ul>
        </div>
    );
};
