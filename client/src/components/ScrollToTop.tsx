import { useEffect } from "react";
import { useLocation, useNavigation } from "react-router";

export const ScrollToTop = () => {
    const { pathname } = useLocation();
    const navigation = useNavigation();

    useEffect(() => {
        // Scroll only when the navigation state changes or the route changes
        if (navigation.state === "idle") {
            window.scrollTo({ top: 0 });
        }
    }, [pathname, navigation.state]);

    return null;
};
