import { createRootRoute } from "@tanstack/react-router";
import { ScrollRestoration } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { SuccessDialog } from "../components/SuccessDialog";
import { getAuthStatus, queryClient } from "../lib/requests";

const Root = () => {
    return (
        <>
            <ScrollRestoration />
            <TopNavBar />
            <Outlet></Outlet>
            <BottomNavBar />
            <SuccessDialog />
        </>
    );
};

export const Route = createRootRoute({
    component: Root,
    loader: async () =>
        await queryClient.ensureQueryData({
            queryKey: ["authState"],
            queryFn: getAuthStatus,
        }),
});
