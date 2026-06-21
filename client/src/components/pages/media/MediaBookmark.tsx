import { useState } from "react";
import { toast } from "react-toastify";

import { AuthData } from "../../../lib/entities";
import { BookMarkIcon } from "../../icons/BookMarkIcon";
import { ToastNotification } from "../../ui/ToastNotification";

interface MediaBookmarkItem {
    id: string;
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
    const userHasSavedItem = (item.onWishlist ?? []).some(
        (wishlistItem) => wishlistItem.userId === userId,
    );
    const [iconFilled, setIconFilled] = useState(userHasSavedItem);
    const [hasSaved, setHasSaved] = useState(userHasSavedItem);

    const getIconColor = () => {
        if (hasSaved && iconFilled) return "#0ea5e9";
        if (hasSaved && !iconFilled) return "#38bdf8";
        if (!hasSaved && iconFilled) return "#e0f2fe";
        return "#ffffff";
    };

    const showNotificationToast = () => {
        toast.dismiss();
        return toast(
            ({ closeToast }) => (
                <ToastNotification
                    text={`${mediaLabel} was ${
                        hasSaved ? "removed from" : "added to"
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
        if (userId) {
            setHasSaved((prevState) => !prevState);
            setIconFilled((prevState) => !prevState);
            try {
                showNotificationToast();
                await addOrRemoveFromWishlist(item.id, userId, hasSaved);
            } catch (error) {
                setHasSaved((prevState) => !prevState);
                setIconFilled((prevState) => !prevState);
                console.log(error);
            }
        }
    };

    return (
        <div className="absolute self-end top-0 right-0 flex flex-col justify-center items-end transition-opacity">
            <BookMarkIcon
                color={getIconColor()}
                handleMouseEnter={() => {
                    hasSaved ? setIconFilled(false) : setIconFilled(true);
                }}
                handleMouseLeave={() => {
                    hasSaved ? setIconFilled(true) : setIconFilled(false);
                }}
                handleClick={saveItem}
            />
        </div>
    );
};
