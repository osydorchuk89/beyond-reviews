import { useSearchParams } from "react-router";

import { BaseButton } from "./BaseButton";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
}: PaginationProps) => {
    const [_searchParams, setSearchParams] = useSearchParams();

    const handlePageChange = (page: number) => {
        if (onPageChange) {
            onPageChange(page);
            return;
        }

        setSearchParams({ page: page.toString() });
    };

    const getPageNumbers = () => {
        const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis-start");
        }

        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("ellipsis-end");
        }

        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 my-8">
            <BaseButton
                handleClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style="orange"
            >
                PREVIOUS
            </BaseButton>

            {getPageNumbers().map((page) =>
                typeof page !== "number" ? (
                    <span key={page} className="px-2">
                        ...
                    </span>
                ) : (
                    <button
                        type="button"
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`cursor-pointer px-4 py-2 rounded-lg ${
                            currentPage === page
                                ? "bg-sky-500 text-white"
                                : "bg-sky-100 hover:bg-sky-200"
                        }`}
                    >
                        {page}
                    </button>
                ),
            )}

            <BaseButton
                handleClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style="orange"
            >
                NEXT
            </BaseButton>
        </div>
    );
};
