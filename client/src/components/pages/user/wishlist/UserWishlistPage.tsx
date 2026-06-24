import { useState } from "react";
import { useLoaderData, useRouteLoaderData } from "react-router";

import {
    MovieRecommendationsData,
    User,
    WishlistData,
} from "../../../../lib/entities";
import { useIsSameUser } from "../../../../hooks/useIsSameUser";
import { BaseTab } from "../../../ui/BaseTab";
import { BooksWishlistContent } from "./BooksWishlistContent";
import { MoviesWishlistContent } from "./MoviesWishlistContent";
import { WishlistEmptyState } from "./WishlistEmptyState";

type WishlistTab = "movies" | "books" | "albums";

const tabs: { value: WishlistTab; label: string }[] = [
    { value: "books", label: "Books" },
    { value: "movies", label: "Movies" },
    { value: "albums", label: "Albums" },
];

export const UserWishlistPage = () => {
    const { user: profileUser } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { wishlistData, movieRecommendationsDataPromise } =
        useLoaderData() as {
            wishlistData: WishlistData;
            movieRecommendationsDataPromise: Promise<MovieRecommendationsData | null> | null;
        };
    const { isSameUser, profileUserName } = useIsSameUser(profileUser);
    const [selectedTab, setSelectedTab] = useState<WishlistTab>("books");

    return (
        <div className="flex flex-col gap-8 items-center w-full">
            <div className="flex flex-col items-center gap-5 w-full">
                <h2 className="text-xl text-center font-bold">Wishlist</h2>
                <div className="flex flex-wrap justify-center gap-2">
                    {tabs.map((tab) => (
                        <BaseTab
                            key={tab.value}
                            isSelected={selectedTab === tab.value}
                            onClick={() => setSelectedTab(tab.value)}
                        >
                            {tab.label}
                        </BaseTab>
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-8 w-full min-h-[50vh]">
                {selectedTab === "books" && (
                    <BooksWishlistContent
                        wishlistData={wishlistData}
                        isSameUser={Boolean(isSameUser)}
                        profileUserName={profileUserName}
                    />
                )}

                {selectedTab === "movies" && (
                    <MoviesWishlistContent
                        wishlistData={wishlistData}
                        movieRecommendationsDataPromise={
                            movieRecommendationsDataPromise
                        }
                        isSameUser={Boolean(isSameUser)}
                        profileUserName={profileUserName}
                    />
                )}

                {selectedTab === "albums" && (
                    <WishlistEmptyState
                        isSameUser={Boolean(isSameUser)}
                        profileUserName={profileUserName}
                        mediaLabel="albums"
                    />
                )}
            </div>
        </div>
    );
};
