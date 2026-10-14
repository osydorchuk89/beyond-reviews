import { useLayoutEffect, useRef, type RefObject } from "react";
import { useLocation, useMatches, useNavigation } from "react-router";
import { getPageMetadata } from "../lib/pageMetadata";

interface PageNavigationProps {
    mainRef: RefObject<HTMLElement | null>;
}

export const PageNavigation = ({ mainRef }: PageNavigationProps) => {
    const { pathname } = useLocation();
    const navigation = useNavigation();
    const { documentTitle } = getPageMetadata(useMatches());
    const previousPathname = useRef(pathname);

    useLayoutEffect(() => {
        if (navigation.state !== "idle") return;
        const main = mainRef.current;
        const heading = main?.querySelector<HTMLHeadingElement>("h1");
        // An existing route error boundary can override the normal route's title.
        document.title = heading?.dataset.documentTitle
            ? `${heading.dataset.documentTitle} | Beyond Reviews`
            : documentTitle;

        if (previousPathname.current === pathname) return;
        // Wait for a closing dialog to restore focus before focusing the destination.
        const frame = requestAnimationFrame(() => {
            previousPathname.current = pathname;
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            (heading ?? main)?.focus({ preventScroll: true });
        });
        return () => cancelAnimationFrame(frame);
    }, [pathname, navigation.state, documentTitle, mainRef]);

    return null;
};
