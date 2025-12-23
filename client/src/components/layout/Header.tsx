import {
    Link,
    useLocation,
    useNavigate,
    useRouteLoaderData,
} from "react-router";

import { headerNavLinks } from "../../lib/data";
import { LogoutButton } from "../ui/LogoutButton";
import { AuthData } from "../../lib/entities";
import { ButtonLink } from "../ui/ButtonLink";

export const Header = () => {
    let { pathname } = useLocation();
    const navigate = useNavigate();

    const { authData } = useRouteLoaderData("root") as { authData: AuthData };

    let userInitials = "";
    if (authData.user) {
        userInitials =
            authData.user.firstName.slice(0, 1) +
            authData.user.lastName.slice(0, 1);
    }

    return (
        <header
            className={`w-full bg-sky-800 h-24 flex justify-between items-center text-white px-48 ${
                pathname !== "/" ? "sticky top-0 z-10" : ""
            }`}
        >
            <Link
                className="text-2xl font-semibold hover:text-orange-500"
                to="/"
            >
                Beyond Reviews
            </Link>
            <ul className="flex gap-8">
                {headerNavLinks.map((link) => (
                    <li key={link.text}>
                        <Link
                            className="text-xl hover:text-orange-500"
                            to={link.to}
                        >
                            {link.text}
                        </Link>
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
                            <p className="text-orange-950">{userInitials}</p>
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
