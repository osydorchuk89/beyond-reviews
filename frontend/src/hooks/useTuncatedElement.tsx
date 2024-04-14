import { useLayoutEffect, useState } from "react";

export const useTruncatedElement = ({
    ref,
}: {
    ref: React.RefObject<HTMLParagraphElement>;
}) => {
    const [isTruncated, setIsTruncated] = useState(false);
    const [isShowingMore, setIsShowingMore] = useState(false);

    useLayoutEffect(() => {
        const { offsetHeight, scrollHeight } = ref.current || {};

        if (offsetHeight && scrollHeight && offsetHeight < scrollHeight) {
            setIsTruncated(true);
        } else {
            setIsTruncated(false);
        }
    }, [ref]);

    const toggleIsShowingMore = () => setIsShowingMore((prev) => !prev);

    return {
        isTruncated,
        isShowingMore,
        toggleIsShowingMore,
    };
};
