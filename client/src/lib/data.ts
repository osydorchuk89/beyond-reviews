export const headerNavLinks = [
    { text: "Books", to: "/books" },
    { text: "Movies", to: "/movies" },
    { text: "Music", to: "/music" },
];

export const profileNavLinks = [
    { text: "Activities", to: "../activities" },
    { text: "Reviews", to: "../reviews" },
    { text: "Watchlist", to: "../watch-list" },
    { text: "Friends", to: "../friends" },
    { text: "Messages", to: "../messages" },
    { text: "Settings", to: "../settings" },
];

export const sideBarFilterList = [
    { type: "releaseYear", value: "2025", text: "2025" },
    { type: "releaseYear", value: "2024", text: "2024" },
    { type: "releaseYear", value: "2023", text: "2023" },
    { type: "genre", value: "Action", text: "Action" },
    { type: "genre", value: "Comedy", text: "Comedy" },
    { type: "genre", value: "Drama", text: "Drama" },
];

export const sideBarSortList = [
    {
        type: "sortBy",
        value: "releaseYear",
        text: "Year (Newest)",
        sortOrder: "desc",
    },
    {
        type: "sortBy",
        value: "releaseYear",
        text: "Year (Oldest)",
        sortOrder: "asc",
    },
    {
        type: "sortBy",
        value: "numRatings",
        text: "Most Reviews",
        sortOrder: "desc",
    },
    {
        type: "sortBy",
        value: "numRatings",
        text: "Least Reviews",
        sortOrder: "asc",
    },
    {
        type: "sortBy",
        value: "avgRating",
        text: "Highest Rated",
        sortOrder: "desc",
    },
    {
        type: "sortBy",
        value: "avgRating",
        text: "Lowest Ratest",
        sortOrder: "asc",
    },
];

export const movieInfoFilterList = [{ value: "" }];
