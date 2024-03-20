import { useLayoutEffect, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
// import { checkUser } from "../lib/checkUser";
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

    // const { data, isLoading, isError, error } = useQuery({
    //     queryKey: ["checkUser"],
    //     queryFn: checkUser,
    // });

    return (
        <ScrollToTopWrapper>
            <TopNavBar />
            <Outlet></Outlet>
            <BottomNavBar />
        </ScrollToTopWrapper>
    );
};
