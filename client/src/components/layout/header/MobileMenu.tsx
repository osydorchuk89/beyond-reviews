import { useEffect } from "react";
import { useLocation } from "react-router";

import { MenuIcon } from "../../icons/MenuIcon";
import { MobileMenuModal } from "./MobileMenuModal";
import { useMobileMenuStore } from "../../../store";
import type { User } from "../../../lib/entities";

interface MobileMenuProps {
    user: User | undefined;
}

export const MobileMenu = ({ user }: MobileMenuProps) => {
    const { isMenuOpen, openMenu, closeMenu } = useMobileMenuStore(
        (state) => state,
    );
    const { pathname } = useLocation();
    const userId = user?.id;

    // biome-ignore lint/correctness/useExhaustiveDependencies: Close on page or account changes, not on query updates or data revalidation.
    useEffect(() => {
        closeMenu();
    }, [pathname, userId, closeMenu]);

    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 40rem)");
        const handleResize = () => {
            if (!desktop.matches || !useMobileMenuStore.getState().isMenuOpen)
                return;
            closeMenu();
            // The mobile trigger is hidden on desktop, so restore focus to visible navigation.
            requestAnimationFrame(() => {
                const navigation = document.querySelector(
                    'nav[aria-label="Primary navigation"]',
                );
                const target =
                    navigation?.querySelector<HTMLAnchorElement>(
                        'a[aria-current="page"]',
                    ) ?? navigation?.querySelector<HTMLAnchorElement>("a");
                target?.focus();
            });
        };
        desktop.addEventListener("change", handleResize);
        return () => desktop.removeEventListener("change", handleResize);
    }, [closeMenu]);

    return (
        <>
            <button
                type="button"
                onClick={openMenu}
                className="sm:hidden p-2 hover:bg-sky-700 rounded-lg cursor-pointer"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
                aria-controls={isMenuOpen ? "mobile-navigation" : undefined}
            >
                <MenuIcon />
            </button>

            <MobileMenuModal />
        </>
    );
};
