import { useLayoutEffect, useState, type RefObject } from "react";

export const useTruncatedElement = ({
    ref,
}: {
    ref: RefObject<HTMLParagraphElement>;
}) => {
    const [isTruncated, setIsTruncated] = useState(false);
    const [isShowingMore, setIsShowingMore] = useState(false);

    useLayoutEffect(() => {
        const paragraph = ref.current;
        if (!paragraph || isShowingMore) return;
        const measure = () => {
            // Keep the focused collapse control mounted if resizing removes the clamp.
            if (paragraph.parentElement?.contains(document.activeElement))
                return;
            setIsTruncated(paragraph.offsetHeight < paragraph.scrollHeight);
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(paragraph);
        return () => observer.disconnect();
    }, [ref, isShowingMore]);

    const toggleIsShowingMore = () => setIsShowingMore((prev) => !prev);

    return {
        isTruncated,
        isShowingMore,
        toggleIsShowingMore,
    };
};
