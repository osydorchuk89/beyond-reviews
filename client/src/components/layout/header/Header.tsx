import { Link, useLocation, useRouteLoaderData } from "react-router";

import { headerNavLinks } from "../../../lib/data";
import { LogoutButton } from "../../ui/LogoutButton";
import { AuthData } from "../../../lib/entities";
import { ButtonLink } from "../../ui/ButtonLink";
import { horizontalPadding, textSizes } from "../../../styles/responsive";
import { HeaderNavLink } from "./HeaderNavLink";
import { UserButton } from "./UserButton";
import { MobileMenu } from "./MobileMenu";

export const Header = () => {
    const { pathname } = useLocation();

    const { authData } = useRouteLoaderData("root") as { authData: AuthData };

    return (
        <header
            className={`${horizontalPadding.page} w-full bg-sky-800 h-24 flex justify-between items-center text-white ${
                pathname === "/" ? "" : "sticky top-0 z-10"
            }`}
        >
            <Link
                className={`${textSizes.heading} text-2xl font-semibold hover:text-orange-500`}
                to="/"
                onClick={(e) => {
                    if (pathname === "/") {
                        e.preventDefault();
                    }
                }}
            >
                Beyond Reviews
            </Link>
            <ul className="hidden sm:flex flex-row gap-8">
                {headerNavLinks.map((link) => (
                    <li key={link.text}>
                        <HeaderNavLink to={link.to}>{link.text}</HeaderNavLink>
                    </li>
                ))}
            </ul>

            {authData.user ? (
                <div className="hidden sm:flex gap-4 justify-center items-center">
                    <UserButton user={authData.user} />
                    <LogoutButton />
                </div>
            ) : (
                <div className="hidden sm:block">
                    <ButtonLink
                        style="orange"
                        to="/login"
                        state={{ from: location.pathname }}
                    >
                        LOGIN
                    </ButtonLink>
                </div>
            )}

            <MobileMenu user={authData.user} />
        </header>
    );
};
