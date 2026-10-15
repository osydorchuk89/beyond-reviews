import { useState } from "react";
import { type Id, toast } from "react-toastify";

import type { AuthData } from "../../../lib/entities";
import { BookMarkIcon } from "../../icons/BookMarkIcon";
import { ToastNotification } from "../../ui/ToastNotification";
import { getWishlistKey, useWishlistStore } from "../../../store";

let wishlistSuccessToastId: Id | undefined;

interface MediaBookmarkItem {
    id: string;
    title: string;
    onWishlist?: { userId: string }[];
}

interface MediaBookmarkProps<TItem extends MediaBookmarkItem> {
    item: TItem;
    authData: AuthData;
    mediaLabel: string;
    addOrRemoveFromWishlist: (
        itemId: string,
        userId: string,
        hasSaved: boolean,
    ) => Promise<void>;
}

export const MediaBookmark = <TItem extends MediaBookmarkItem>({
    item,
    authData,
    mediaLabel,
    addOrRemoveFromWishlist,
}: MediaBookmarkProps<TItem>) => {
    const userId = authData.user?.id;
    const key = getWishlistKey(mediaLabel, item.id, userId);
    const { selection, toggle } = useWishlistStore((state) => state);
    const hasSaved =
        selection?.key === key
            ? selection.hasSaved
            : (item.onWishlist ?? []).some((entry) => entry.userId === userId);
    const isPending = selection?.key === key && selection.isPending;
    const [isHovered, setIsHovered] = useState(false);
    const iconFilled = isHovered ? !hasSaved : hasSaved;

    const getIconColor = () => {
        if (hasSaved && iconFilled) return "#0ea5e9";
        if (hasSaved && !iconFilled) return "#38bdf8";
        if (!hasSaved && iconFilled) return "#e0f2fe";
        return "#ffffff";
    };

    const showNotificationToast = (saved: boolean) => {
        if (wishlistSuccessToastId !== undefined)
            toast.dismiss(wishlistSuccessToastId);
        wishlistSuccessToastId = toast(
            ({ closeToast }) => (
                <ToastNotification
                    text={`${mediaLabel} was ${
                        saved ? "added to" : "removed from"
                    } your wishlist`}
                    closeToast={closeToast}
                />
            ),
            {
                closeButton: false,
            },
        );
    };

    const saveItem = async () => {
        if (!userId) return;
        const saved = await toggle(key, (previousSaved) =>
            addOrRemoveFromWishlist(item.id, userId, previousSaved),
        );
        if (saved !== undefined) showNotificationToast(saved);
    };

    return (
        <div className="absolute self-end top-0 right-0 flex flex-col justify-center items-end transition-opacity">
            <BookMarkIcon
                aria-label={`Save ${item.title} to wishlist`}
                aria-pressed={hasSaved}
                aria-disabled={isPending}
                aria-busy={isPending}
                color={getIconColor()}
                handleMouseEnter={() => {
                    setIsHovered(true);
                }}
                handleMouseLeave={() => {
                    setIsHovered(false);
                }}
                handleClick={saveItem}
            />
        </div>
    );
};
