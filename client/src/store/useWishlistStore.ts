import { create } from "zustand";

interface WishlistSelection {
    key: string;
    hasSaved: boolean;
    isPending: boolean;
    status: string;
    error: string;
}

interface WishlistStore {
    selection: WishlistSelection | null;
    initialize: (key: string, hasSaved: boolean) => void;
    clear: (key: string) => void;
    toggle: (
        key: string,
        save: (hasSaved: boolean) => Promise<void>,
    ) => Promise<boolean | undefined>;
}

export const getWishlistKey = (
    mediaType: string,
    itemId: string,
    userId?: string,
) => `${mediaType}:${itemId}:${userId ?? "anonymous"}`;

export const useWishlistStore = create<WishlistStore>()((set, get) => ({
    selection: null,
    initialize: (key, hasSaved) => {
        set({
            selection: {
                key,
                hasSaved,
                isPending: false,
                status: "",
                error: "",
            },
        });
    },
    clear: (key) => {
        if (get().selection?.key === key) set({ selection: null });
    },
    toggle: async (key, save) => {
        const selection = get().selection;
        if (!selection || selection.key !== key || selection.isPending) return;

        const pendingSelection = {
            ...selection,
            isPending: true,
            status: "Updating wishlist…",
            error: "",
        };
        set({ selection: pendingSelection });
        try {
            await save(selection.hasSaved);
            // A different item/account or a remount owns a new selection object.
            if (get().selection !== pendingSelection) return;
            const hasSaved = !selection.hasSaved;
            set({ selection: { ...selection, hasSaved, error: "" } });
            // The existing wishlist toast announces success.
            return hasSaved;
        } catch {
            if (get().selection === pendingSelection) {
                set({
                    selection: {
                        ...selection,
                        error: "Could not update your wishlist. Try again.",
                    },
                });
            }
        }
    },
}));
