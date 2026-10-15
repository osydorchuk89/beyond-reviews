import { useEffect, useId, useRef, useState } from "react";

export const useHorizontalScroll = (itemCount: number) => {
    const scrollId = useId();
    const scrollContainerRef = useRef<HTMLElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const handleScroll = (direction: "left" | "right") => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const scrollAmount = scrollContainer.clientWidth * 0.8;
        scrollContainer.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies(itemCount): Recalculate scroll limits after the rendered item count changes.
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const updateScrollState = () => {
            const maxScrollLeft =
                scrollContainer.scrollWidth - scrollContainer.clientWidth;

            setCanScrollLeft(scrollContainer.scrollLeft > 0);
            setCanScrollRight(scrollContainer.scrollLeft < maxScrollLeft - 1);
        };

        updateScrollState();
        const revealFocus = (event: FocusEvent) => {
            if (!(event.target instanceof HTMLElement)) return;
            const target = event.target.getBoundingClientRect();
            const container = scrollContainer.getBoundingClientRect();
            const delta =
                target.left < container.left
                    ? target.left - container.left
                    : target.right > container.right
                      ? target.right - container.right
                      : 0;
            if (delta)
                scrollContainer.scrollBy({ left: delta, behavior: "instant" });
        };
        const observer = new ResizeObserver(updateScrollState);
        observer.observe(scrollContainer);
        scrollContainer.addEventListener("scroll", updateScrollState);
        scrollContainer.addEventListener("focusin", revealFocus);
        window.addEventListener("resize", updateScrollState);

        return () => {
            scrollContainer.removeEventListener("scroll", updateScrollState);
            scrollContainer.removeEventListener("focusin", revealFocus);
            observer.disconnect();
            window.removeEventListener("resize", updateScrollState);
        };
    }, [itemCount]);

    return {
        scrollId,
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        handleScroll,
    };
};
