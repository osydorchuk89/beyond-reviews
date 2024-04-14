import { useState } from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { CloseIcon } from "./CloseIcon";

interface Item {
    type: string;
    value: string;
    text: string;
}

interface SortFilterProps {
    itemsList: Item[];
    title: string;
}

const routeApi = getRouteApi("/movies/");

export const SortFilterBar = ({ itemsList, title }: SortFilterProps) => {
    const { filter, sort } = routeApi.useSearch();
    const [filterSortValue, setFilterSortValue] = useState("");
    const navigate = useNavigate();
    console.log(filterSortValue);

    const linkClassName =
        "flex items-center gap-2 text-amber-950 p-2 rounded-md hover:bg-amber-300";
    const activeLinkClassName = linkClassName + " bg-amber-300";

    const handleCancelSortFilter = (type: string) => {
        setFilterSortValue("");
        navigate({
            search: (prevState) => ({ ...prevState, [type]: "" }),
        });
    };

    return (
        <div className="w-1/2 flex flex-col justify-between rounded-md m-5 bg-amber-100 overflow-hidden">
            <p className="bg-amber-700 text-amber-50 text-center text-xl font-bold py-2">
                {title}
            </p>
            <div className="flex justify-between font-bold px-10 py-3">
                {itemsList.map((item) => (
                    <div
                        className={
                            filter === item.value || sort === item.value
                                ? activeLinkClassName
                                : linkClassName
                        }
                    >
                        <Link
                            key={item.value}
                            search={(prevState) => {
                                setFilterSortValue(item.value);
                                return {
                                    ...prevState,
                                    [item.type]: item.value,
                                };
                            }}
                        >
                            {item.text}
                        </Link>
                        {(filter === item.value || sort === item.value) &&
                            filterSortValue.length > 0 && (
                                <CloseIcon
                                    className="w-5 h-5 cursor-pointer"
                                    handleClick={() =>
                                        handleCancelSortFilter(item.type)
                                    }
                                />
                            )}
                    </div>
                ))}
            </div>
        </div>
    );
};
