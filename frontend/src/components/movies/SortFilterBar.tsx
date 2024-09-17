import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { CloseIcon } from "../icons/CloseIcon";

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
    const navigate = useNavigate();

    const linkClassName =
        "flex items-center gap-2 text-amber-950 px-2 rounded-md hover:bg-amber-200";
    const activeLinkClassName =
        linkClassName.replace(" hover:bg-amber-200", " ") +
        "bg-amber-300 hover:bg-amber-300";

    const handleCancelSortFilter = (type: string) => {
        navigate({
            search: (prevState) => ({ ...prevState, [type]: "" }),
            resetScroll: false,
        });
    };

    return (
        <div className="flex flex-col rounded-md shadow-md bg-amber-100 overflow-hidden">
            <p className="bg-amber-700 text-amber-50 text-center text-xl font-bold py-2">
                {title}
            </p>
            <div className="flex flex-col justify-between font-bold px-5 py-2 items-center md:items-stretch">
                {itemsList.map((item) => (
                    <div
                        key={item.value}
                        className={
                            filter === item.value || sort === item.value
                                ? activeLinkClassName
                                : linkClassName
                        }
                    >
                        <Link
                            search={(prevState) => ({
                                ...prevState,
                                [item.type]: item.value,
                            })}
                            resetScroll={false}
                            className="w-full py-2"
                        >
                            {item.text}
                        </Link>
                        {(filter === item.value || sort === item.value) && (
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
