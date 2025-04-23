import { Outlet } from "react-router";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { ScrollToTop } from "./ScrollToTop";

export const MainLayout = () => {
    return (
        <>
            <ScrollToTop />
            <Header />
            <Outlet />
            <Footer />
        </>
    );
};
