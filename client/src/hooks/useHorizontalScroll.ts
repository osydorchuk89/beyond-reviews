import { useEffect, useRef, useState } from "react";

export const useHorizontalScroll = (itemCount: number) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
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
        scrollContainer.addEventListener("scroll", updateScrollState);
        window.addEventListener("resize", updateScrollState);

        return () => {
            scrollContainer.removeEventListener("scroll", updateScrollState);
            window.removeEventListener("resize", updateScrollState);
        };
    }, [itemCount]);

    return {
        scrollContainerRef,
        canScrollLeft,
        canScrollRight,
        handleScroll,
    };
};
