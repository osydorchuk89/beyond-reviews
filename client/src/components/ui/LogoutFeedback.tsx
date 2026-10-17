import { useEffect } from "react";
import { useFetcher } from "react-router";
import { useMobileMenuStore } from "../../store";
import { ActionFeedback } from "./ActionFeedback";

export const LogoutFeedback = () => {
    const fetcher = useFetcher<{ error?: string }>({ key: "logout" });
    const error = fetcher.state === "idle" ? (fetcher.data?.error ?? "") : "";
    const closeMenu = useMobileMenuStore((state) => state.closeMenu);

    useEffect(() => {
        // Keep the error notification available outside the modal's inert area.
        if (error) closeMenu();
    }, [error, closeMenu]);

    return (
        <ActionFeedback
            status={fetcher.state !== "idle" ? "Signing out…" : ""}
            error={error}
        />
    );
};
