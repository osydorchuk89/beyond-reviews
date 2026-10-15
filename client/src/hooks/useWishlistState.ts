import { useLayoutEffect } from "react";
import { useWishlistStore } from "../store";

// Each detail page owns the lifetime of the shared desktop/mobile selection.
export const useWishlistState = (key: string | null, initialSaved: boolean) => {
    const { selection, initialize, clear } = useWishlistStore((state) => state);

    // biome-ignore lint/correctness/useExhaustiveDependencies(initialSaved): Seed on item/account changes; same-page revalidation must preserve pending requests and confirmed selection.
    useLayoutEffect(() => {
        if (!key) return;
        initialize(key, initialSaved);
        return () => clear(key);
    }, [key, initialize, clear]);

    return selection?.key === key ? selection : null;
};
