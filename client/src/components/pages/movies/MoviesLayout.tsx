import { Outlet } from "react-router";

export const MoviesLayout = () => {
    // Keep catalog controls mounted while query parameters load new results.
    return <Outlet />;
};
