import { useState, useEffect } from "react";
import { useLocation } from "react-router";

import { MenuIcon } from "../../icons/MenuIcon";
import { HeaderNavLink } from "./HeaderNavLink";
import { LogoutButton } from "../../ui/LogoutButton";
import { headerNavLinks } from "../../../lib/data";
import type { User } from "../../../lib/entities";
import { CloseIcon } from "../../icons/CloseIcon";
import { ButtonLink } from "../../ui/ButtonLink";

interface MobileMenuProps {
    user: User | undefined;
}

export const MobileMenu = ({ user }: MobileMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const openMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

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

            {isOpen && (
                <>
                    <div
                        className="sm:hidden fixed inset-0 bg-black/70 z-40"
                        onClick={closeMenu}
                    />

                    <div className="sm:hidden fixed top-0 right-0 h-full w-64 bg-sky-800 z-50 shadow-xl">
                        <div className="flex justify-end p-4">
                            <CloseIcon style="light" handleClick={closeMenu} />
                        </div>

                        <nav className="flex flex-col px-4 gap-2">
                            {headerNavLinks.map((link) => (
                                <div key={link.text} onClick={closeMenu}>
                                    <HeaderNavLink to={link.to}>
                                        {link.text}
                                    </HeaderNavLink>
                                </div>
                            ))}

                            <div className="border-t border-sky-600 my-4" />

                            {user ? (
                                <div className="flex flex-col gap-4">
                                    <HeaderNavLink
                                        to={`/users/${user?.id}/profile`}
                                    >
                                        Your profile
                                    </HeaderNavLink>
                                    <LogoutButton />
                                </div>
                            ) : (
                                <ButtonLink
                                    style="orange"
                                    to="/login"
                                    state={{ from: location.pathname }}
                                >
                                    LOGIN
                                </ButtonLink>
                            )}
                        </nav>
                    </div>
                </>
            )}
        </>
    );
};
