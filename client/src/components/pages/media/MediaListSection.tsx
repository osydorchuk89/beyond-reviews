import { ReactNode, useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { BaseButton } from "../../ui/BaseButton";
import { MediaFilters } from "./MediaFilters";

interface LoadMoreResult<TItem> {
    items: TItem[];
    hasMore: boolean;
}

interface MediaListSectionProps<TItem> {
    items: TItem[];
    filters: string[];
    hasMore: boolean;
    currentPage: number;
    emptyMessage: string;
    filterParamByLabel: Record<string, string>;
    loadMoreItems: (
        nextPage: number,
        searchParams: URLSearchParams,
    ) => Promise<LoadMoreResult<TItem>>;
    renderItems: (items: TItem[]) => ReactNode;
    fetchErrorMessage?: string;
}

export function MediaListSection<TItem>({
    items,
    filters,
    hasMore,
    currentPage,
    emptyMessage,
    filterParamByLabel,
    loadMoreItems,
    renderItems,
    fetchErrorMessage = "Failed to load more items:",
}: MediaListSectionProps<TItem>) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [additionalItems, setAdditionalItems] = useState<TItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(currentPage);
    const [hasMoreItems, setHasMoreItems] = useState(hasMore);

    const allItems = [...items, ...additionalItems];

    const handleLoadMore = async () => {
        setLoading(true);
        try {
            const nextPage = page + 1;
            const data = await loadMoreItems(nextPage, searchParams);
            setAdditionalItems((prev) => [...prev, ...data.items]);
            setPage(nextPage);
            setHasMoreItems(data.hasMore);
        } catch (error) {
            console.error(fetchErrorMessage, error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setAdditionalItems([]);
        setPage(currentPage);
        setHasMoreItems(hasMore);
    }, [items, currentPage, hasMore]);

    const handleCloseFilterTag = (filter: string) => {
        setSearchParams((searchParams) => {
            Object.entries(filterParamByLabel).forEach(([label, param]) => {
                if (filter.includes(label)) {
                    searchParams.delete(param);
                }
            });
            searchParams.delete("page");
            return searchParams;
        });
    };

    return (
        <div className="flex flex-col w-full">
            {filters.length > 0 && (
                <MediaFilters
                    filters={filters}
                    handleCloseFilterTag={handleCloseFilterTag}
                />
            )}
            <div className="flex flex-col gap-10 mb-10 items-center">
                {allItems.length > 0 ? (
                    <>
                        {renderItems(allItems)}
                        {hasMoreItems && (
                            <div className="flex justify-center mb-10">
                                <BaseButton
                                    style="sky"
                                    handleClick={handleLoadMore}
                                    disabled={loading}
                                >
                                    {loading ? "LOADING..." : "LOAD MORE"}
                                </BaseButton>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex justify-center items-start mt-20 h-[50vh]">
                        <p className="text-2xl">{emptyMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
