import { ReactNode, Suspense } from "react";
import { Await } from "react-router";

import { SearchItem } from "../../../lib/entities";
import { horizontalPadding } from "../../../styles/responsive";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { SearchBar } from "../movies/SearchBar";
import { SortFilterBar } from "../movies/SortFilterBar";

interface MediaCatalogPageProps<TData> {
    title: string;
    dataPromise: Promise<TData>;
    searchPlaceholder?: string;
    sortItems: SearchItem[];
    filterItems: SearchItem[];
    children?: ReactNode;
    renderContent: (data: TData) => ReactNode;
}

export function MediaCatalogPage<TData>({
    title,
    dataPromise,
    searchPlaceholder,
    sortItems,
    filterItems,
    children,
    renderContent,
}: MediaCatalogPageProps<TData>) {
    return (
        <div className="flex flex-col w-full mb-5">
            <p className="text-4xl text-center font-bold py-5 mb-5">
                {title}
            </p>
            <div
                className={`flex flex-col lg:flex-row items-center gap-4 lg:items-start ${horizontalPadding.page}`}
            >
                <aside className="flex flex-col w-5/6 lg:w-1/4 gap-8 mb-5">
                    <SearchBar placeholder={searchPlaceholder} />
                    <SortFilterBar itemsList={sortItems} title="Sort by:" />
                    <SortFilterBar itemsList={filterItems} title="Filter:" />
                </aside>
                <div className="flex flex-col w-full md:w-3/4">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Await resolve={dataPromise}>{renderContent}</Await>
                    </Suspense>
                </div>
            </div>
            {children}
        </div>
    );
}
