import { createRootRoute } from "@tanstack/react-router";
import { ScrollRestoration } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";

const Root = () => {
    return (
        <>
            <ScrollRestoration />
            <TopNavBar />
            <Outlet></Outlet>
            <BottomNavBar />
        </>
    );
};

export const Route = createRootRoute({
    component: Root,
});
