import { Outlet } from "react-router";
import { Header } from "./layout/header/Header";
import { Footer } from "./layout/footer/Footer";
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
