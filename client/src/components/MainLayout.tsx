import { useRef } from "react";
import { Outlet } from "react-router";
import { Header } from "./layout/header/Header";
import { Footer } from "./layout/footer/Footer";
import { PageNavigation } from "./PageNavigation";
import { NotificationContainer } from "./ui/NotificationContainer";
import { LogoutFeedback } from "./ui/LogoutFeedback";

export const MainLayout = () => {
    const mainRef = useRef<HTMLElement>(null);
    return (
        <>
            <PageNavigation mainRef={mainRef} />
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-white focus:p-3 focus:text-sky-950 focus:font-bold"
            >
                Skip to main content
            </a>
            <Header />
            <main ref={mainRef} id="main-content" tabIndex={-1}>
                <Outlet />
            </main>
            <Footer />
            <NotificationContainer />
            <LogoutFeedback />
        </>
    );
};
