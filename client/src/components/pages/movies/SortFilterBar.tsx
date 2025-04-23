import { useSearchParams } from "react-router";
import { CloseIcon } from "../../icons/CloseIcon";

interface Item {
    type: string;
    value: string;
    text: string;
}

interface SortFilterProps {
    itemsList: Item[];
    title: string;
}

export const SortFilterBar = ({ itemsList, title }: SortFilterProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const filter = searchParams.get("filter");
    const sort = searchParams.get("sort");

    const baseLinkClassName =
        "flex items-center gap-2 text-orange-950 px-2 rounded-md cursor-pointer";
    const inactiveLinkClassName = baseLinkClassName + " hover:bg-orange-200";
    const activeLinkClassName =
        baseLinkClassName + " bg-orange-300 hover:bg-orange-300";

    const handleCancelSortFilter = (type: string) => {
        setSearchParams((searchParams) => {
            searchParams.delete(type);
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
                    <li
                        key={item.value}
                        className={
                            filter === item.value || sort === item.value
                                ? activeLinkClassName
                                : inactiveLinkClassName
                        }
                    >
                        <div
                            className="w-full py-2"
                            onClick={() => {
                                setSearchParams((searchParams) => {
                                    searchParams.set(item.type, item.value);
                                    return searchParams;
                                });
                            }}
                        >
                            {item.text}
                        </div>
                        {(filter === item.value || sort === item.value) && (
                            <CloseIcon
                                handleClick={() =>
                                    handleCancelSortFilter(item.type)
                                }
                            />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};
