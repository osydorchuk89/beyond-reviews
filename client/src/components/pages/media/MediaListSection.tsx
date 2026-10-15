import {
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { useSearchParams } from "react-router";

import { BaseButton } from "../../ui/BaseButton";
import { MediaFilters } from "./MediaFilters";
import { ActionFeedback } from "../../ui/ActionFeedback";

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
    const sectionRef = useRef<HTMLDivElement>(null);
    const loadButtonRef = useRef<HTMLButtonElement>(null);
    const requestId = useRef(0);
    const pending = useRef(false);
    const focusNewItem = useRef<number | null>(null);
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    // biome-ignore lint/correctness/useExhaustiveDependencies(additionalItems): Wait until newly loaded cards are mounted before restoring focus.
    useLayoutEffect(() => {
        const index = focusNewItem.current;
        if (index === null) return;
        focusNewItem.current = null;
        const cards = sectionRef.current?.querySelectorAll<HTMLElement>(
            "[data-catalog-list] > li",
        );
        (cards?.[index] ?? cards?.[0])
            ?.querySelector<HTMLAnchorElement>("a")
            ?.focus();
    }, [additionalItems]);

    const allItems = [...items, ...additionalItems];

    const handleLoadMore = async () => {
        if (pending.current) return;
        pending.current = true;
        const currentRequest = ++requestId.current;
        setLoading(true);
        setStatus("Loading more results…");
        setError("");
        try {
            const nextPage = page + 1;
            const data = await loadMoreItems(nextPage, searchParams);
            if (currentRequest !== requestId.current) return;
            if (
                !data.hasMore &&
                document.activeElement === loadButtonRef.current
            )
                focusNewItem.current = allItems.length;
            setAdditionalItems((prev) => [...prev, ...data.items]);
            setPage(nextPage);
            setHasMoreItems(data.hasMore);
            setStatus(
                `${data.items.length} more results loaded. ${allItems.length + data.items.length} results shown.`,
            );
        } catch (error) {
            if (currentRequest !== requestId.current) return;
            console.error(fetchErrorMessage, error);
            setStatus("");
            setError("Could not load more results. Try again.");
        } finally {
            if (currentRequest === requestId.current) {
                pending.current = false;
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        ++requestId.current;
        pending.current = false;
        setLoading(false);
        setStatus(`${items.length} results shown.`);
        setError("");
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
        <div ref={sectionRef} className="flex flex-col w-full">
            {filters.length > 0 && (
                <MediaFilters
                    filters={filters}
                    handleCloseFilterTag={handleCloseFilterTag}
                />
            )}
            <div
                aria-busy={loading}
                className="flex flex-col gap-10 mb-10 items-center"
            >
                {allItems.length > 0 ? (
                    <>
                        {renderItems(allItems)}
                        {hasMoreItems && (
                            <div className="flex justify-center mb-10">
                                <BaseButton
                                    ref={loadButtonRef}
                                    style="sky"
                                    handleClick={handleLoadMore}
                                    aria-disabled={loading}
                                    aria-busy={loading}
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
            <ActionFeedback status={status} error={error} />
        </div>
    );
}
