import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
} from "@headlessui/react";
import { useLocation, useRouteLoaderData } from "react-router";

import { useMobileMenuStore } from "../../../store";
import { CloseIcon } from "../../icons/CloseIcon";
import { HeaderNavLink } from "./HeaderNavLink";
import { LogoutButton } from "../../ui/LogoutButton";
import { ButtonLink } from "../../ui/ButtonLink";
import { headerNavLinks } from "../../../lib/data";
import type { AuthData } from "../../../lib/entities";

export const MobileMenuModal = () => {
    const { authData } = useRouteLoaderData("root") as { authData: AuthData };
    const { isMenuOpen, closeMenu } = useMobileMenuStore((state) => state);
    const { pathname } = useLocation();

    return (
        <Dialog
            open={isMenuOpen}
            onClose={closeMenu}
            className="fixed inset-0 z-50"
        >
            <DialogBackdrop className="fixed inset-0 bg-black/70" />
            <DialogPanel
                id="mobile-navigation"
                className="fixed top-0 right-0 h-dvh w-64 max-w-full overflow-y-auto bg-sky-800 text-white shadow-xl pb-6"
            >
                <DialogTitle className="sr-only">Navigation menu</DialogTitle>
                <div className="flex justify-end p-4">
                    <CloseIcon
                        style="light"
                        handleClick={closeMenu}
                        aria-label="Close menu"
                        data-autofocus
                    />
                </div>
                <nav
                    aria-label="Mobile navigation"
                    className="flex flex-col px-4 gap-2"
                >
                    {headerNavLinks.map((link) => (
                        <HeaderNavLink
                            key={link.to}
                            to={link.to}
                            onClick={closeMenu}
                        >
                            {link.text}
                        </HeaderNavLink>
                    ))}

                    <div className="border-t border-sky-600 my-4" />

                    {authData.user ? (
                        <div className="flex flex-col gap-4">
                            <HeaderNavLink
                                to={`/users/${authData.user?.id}/profile`}
                                onClick={closeMenu}
                            >
                                Your profile
                            </HeaderNavLink>
                            <LogoutButton />
                        </div>
                    ) : (
                        <ButtonLink
                            style="orange"
                            to="/login"
                            onClick={closeMenu}
                            state={{ from: pathname }}
                        >
                            LOGIN
                        </ButtonLink>
                    )}
                </nav>
            </DialogPanel>
        </Dialog>
    );
};
