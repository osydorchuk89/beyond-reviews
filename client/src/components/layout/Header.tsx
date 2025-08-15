import { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
    useRouteLoaderData,
} from "react-router";

import { BaseButton } from "../ui/BaseButton";
import { headerNavLinks } from "../../lib/data";
import { getAuthData } from "../../lib/actions";
import { useAppSelector } from "../../store/hooks";
import { LogoutButton } from "../ui/LogoutButton";
import { AuthData } from "../../lib/entities";

export const Header = () => {
    let { pathname } = useLocation();
    const navigate = useNavigate();

    const { authData } = useRouteLoaderData("root");
    const [authStatus, setAuthStatus] = useState<AuthData>({
        isAuthenticated: authData.isAuthenticated,
        user: authData.user,
    });
    const authEvent = useAppSelector((state) => state.authEvent);

    const baseHeaderStyle =
        "w-full bg-sky-800 h-24 flex justify-between items-center text-white px-48";
    const stickyHeaderStyle = baseHeaderStyle + " sticky top-0 z-10";

    useEffect(() => {
        const checkAuthStatus = async () => {
            const response = await getAuthData();
            setAuthStatus({
                isAuthenticated: response.isAuthenticated,
                user: response.user,
            });
        };
        checkAuthStatus();
    }, [authEvent]);

    let userInitials = "";
    if (authStatus.user) {
        userInitials =
            authStatus.user.firstName.slice(0, 1) +
            authStatus.user.lastName.slice(0, 1);
    }

    return (
        <header
            className={pathname === "/" ? baseHeaderStyle : stickyHeaderStyle}
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
            {authStatus.user ? (
                <div className="flex gap-4 justify-center items-center">
                    <button
                        onClick={() =>
                            navigate(`/users/${authStatus.user!.id}/profile`)
                        }
                    >
                        <div className="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden bg-orange-300 hover:bg-orange-500 cursor-pointer">
                            <p className="text-orange-950">{userInitials}</p>
                        </div>
                    </button>
                    <LogoutButton />
                </div>
            ) : (
                <BaseButton
                    text="LOGIN"
                    style="orange"
                    handleClick={() => navigate("/login")}
                />
            )}
        </header>
    );
};
