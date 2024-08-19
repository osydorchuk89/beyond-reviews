import { createRootRoute } from "@tanstack/react-router";
import { ScrollRestoration } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";
import { SuccessDialog } from "../components/SuccessDialog";
import { getAuthStatus, queryClient } from "../lib/requests";
import { InfoBar } from "../components/InfoBar";
import { useAppSelector } from "../store/hooks";
import { AnimatePresence } from "framer-motion";

const Root = () => {
    const { justLoggedIn, justLoggedOut, justRegistered, addedToWatchList, removedFromWatchList } = useAppSelector(
        (state) => state.infoBar
    );

    return (
        <>
            <ScrollRestoration />
            <TopNavBar />
            <AnimatePresence>
                {justLoggedIn && <InfoBar action="justLoggedIn" />}
                {justLoggedOut && <InfoBar action="justLoggedOut" />}
                {justRegistered && <InfoBar action="justRegistered" />}
                {addedToWatchList && <InfoBar action="addedToWatchLater" />}
                {removedFromWatchList && <InfoBar action="removedFromWatchLater" />}
            </AnimatePresence>
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
