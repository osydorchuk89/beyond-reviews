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
    const location = useLocation();

    useEffect(() => {
        closeMenu();
    }, [location.pathname, user]);

    return (
        <>
            <button
                onClick={openMenu}
                className="sm:hidden p-2 hover:bg-sky-700 rounded-lg cursor-pointer"
                aria-label="Toggle menu"
            >
                <MenuIcon />
            </button>

            {isMenuOpen && <MobileMenuModal />}
        </>
    );
};
