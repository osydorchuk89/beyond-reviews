import { createRootRoute } from "@tanstack/react-router";
// import { useLayoutEffect, ReactNode } from "react";
// import { Outlet, useLocation } from "react-router-dom";
import { Outlet } from "@tanstack/react-router";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";

// interface Props {
//     children?: ReactNode;
// }

const Root = () => {
    // const ScrollToTopWrapper = ({ children }: Props) => {
    //     const location = useLocation();
    //     useLayoutEffect(() => {
    //         document.documentElement.scrollTo(0, 0);
    //     }, [location.pathname]);
    //     return children;
    // };

    return (
        <>
            <TopNavBar />
            <Outlet></Outlet>
            <BottomNavBar />
        </>
    );
};

export const Route = createRootRoute({
    component: Root,
});
