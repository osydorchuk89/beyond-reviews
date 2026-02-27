import { useRouteLoaderData } from "react-router";

import { useMobileMenuStore } from "../../../store";
import { CloseIcon } from "../../icons/CloseIcon";
import { HeaderNavLink } from "./HeaderNavLink";
import { LogoutButton } from "../../ui/LogoutButton";
import { ButtonLink } from "../../ui/ButtonLink";
import { headerNavLinks } from "../../../lib/data";
import type { AuthData } from "../../../lib/entities";

export const MobileMenuModal = () => {
    const { authData } = useRouteLoaderData("root") as { authData: AuthData };
    const { closeMenu } = useMobileMenuStore((state) => state);

    return (
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

                    {authData.user ? (
                        <div className="flex flex-col gap-4">
                            <HeaderNavLink
                                to={`/users/${authData.user?.id}/profile`}
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
    );
};
