import { useLayoutEffect, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { TopNavBar } from "../components/TopNavbar";
import { BottomNavBar } from "../components/BottomNavBar";

interface Props {
    children?: ReactNode;
}

export const Root = () => {
    const ScrollToTopWrapper = ({ children }: Props) => {
        const location = useLocation();
        useLayoutEffect(() => {
            document.documentElement.scrollTo(0, 0);
        }, [location.pathname]);
        return children;
    };

    return (
        <ScrollToTopWrapper>
            <TopNavBar />
            <Outlet></Outlet>
            <BottomNavBar />
        </ScrollToTopWrapper>
    );
};
