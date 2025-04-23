import {
    Link,
    useLocation,
    useNavigate,
    useRouteLoaderData,
} from "react-router";

import { Button } from "../ui/Button";
import { headerNavLinks } from "../../lib/data";
import { useEffect, useState } from "react";
import { getAuthData } from "../../lib/actions";
import { useAppSelector } from "../../store/hooks";
import { LogoutButton } from "../ui/LogoutButton";
import { User } from "../../lib/entities";

export interface AuthData {
    isAuthenticated: boolean;
    user: User | null;
}

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
                className="text-xl font-semibold hover:text-orange-500"
                to="/"
            >
                Beyond Reviews
            </Link>
            <li className="flex gap-8">
                {headerNavLinks.map((link) => (
                    <ul key={link.text}>
                        <Link className="hover:text-orange-500" to={link.to}>
                            {link.text}
                        </Link>
                    </ul>
                ))}
            </li>
            {authStatus.isAuthenticated ? (
                <div className="flex gap-4 justify-center items-center">
                    <div
                        className="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden bg-orange-300 hover:bg-orange-500 cursor-pointer"
                        onClick={() => navigate("/profile")}
                    >
                        <p className="text-orange-950">{userInitials}</p>
                    </div>
                    <LogoutButton />
                </div>
            ) : (
                <Button
                    text="LOGIN"
                    style="orange"
                    handleClick={() => navigate("/login")}
                />
            )}
        </header>
    );
};
