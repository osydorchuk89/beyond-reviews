import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
    useRouteLoaderData,
} from "react-router";

import { headerNavLinks } from "../../lib/data";
import { LogoutButton } from "../ui/LogoutButton";
import { AuthData } from "../../lib/entities";
import { ButtonLink } from "../ui/ButtonLink";

export const Header = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const { authData } = useRouteLoaderData("root") as { authData: AuthData };

    return (
        <header
            className={`w-full bg-sky-800 h-24 flex justify-between items-center text-white px-48 ${
                pathname !== "/" ? "sticky top-0 z-10" : ""
            }`}
        >
            <Link
                className="text-2xl font-semibold hover:text-orange-500"
                to="/"
                onClick={(e) => {
                    if (pathname === "/") {
                        e.preventDefault();
                    }
                }}
            >
                Beyond Reviews
            </Link>
            <ul className="flex flex-row gap-8">
                {headerNavLinks.map((link) => (
                    <li key={link.text}>
                        <NavLink
                            className={({ isActive }) =>
                                `text-xl hover:text-orange-500 before:content-[attr(data-text)] before:font-semibold before:block before:h-0 before:overflow-hidden before:invisible ${
                                    isActive && "text-orange-500 font-semibold"
                                }`
                            }
                            to={link.to}
                            data-text={link.text}
                            onClick={(e) => {
                                if (pathname === link.to) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            {link.text}
                        </NavLink>
                    </li>
                ))}
            </ul>
            {authData.user ? (
                <div className="flex gap-4 justify-center items-center">
                    <button
                        onClick={() =>
                            navigate(`/users/${authData.user?.id}/profile`)
                        }
                    >
                        <div className="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden bg-orange-300 hover:bg-orange-500 cursor-pointer">
                            <p className="text-orange-950">
                                {authData.user.firstName[0] +
                                    authData.user.lastName[0]}
                            </p>
                        </div>
                    </button>
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
        </header>
    );
};
