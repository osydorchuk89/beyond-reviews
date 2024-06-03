import { createRootRoute } from "@tanstack/react-router";
import { ScrollRestoration } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { SuccessDialog } from "../components/SuccessDialog";
import { getAuthStatus, queryClient } from "../lib/requests";
import { InfoBar } from "../components/InfoBar";
import { useAppSelector } from "../store/hooks";

const Root = () => {
    const { justLoggedIn } = useAppSelector((state) => state.infoBar);

    return (
        <>
            <ScrollRestoration />
            <TopNavBar />
            {justLoggedIn && <InfoBar />}
            <Outlet />
            <BottomNavBar />
            <SuccessDialog />
        </>
    );
};

export const Route = createRootRoute({
    component: Root,
    loader: () =>
        queryClient.ensureQueryData({
            queryKey: ["authState"],
            queryFn: getAuthStatus,
        }),
});
