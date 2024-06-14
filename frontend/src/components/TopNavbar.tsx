import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { AccountMenu } from "./AccountMenu";
import { BASE_URL } from "../lib/urls";
import { MessageBox } from "./MessageBox";
import { getAuthStatus, getUsers, queryClient } from "../lib/requests";
import { AuthStatus } from "../lib/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { infoBarActions } from "../store";

const topLinks = [
    { id: 1, text: "Books", link: "#" },
    { id: 2, text: "Movies", link: "/movies" },
    { id: 3, text: "Music", link: "#" },
];

export const TopNavBar = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { justLoggedIn, justRegistered } = useAppSelector(
        (state) => state.infoBar
    );

    const logout = async () => {
        try {
            await axios({
                method: "get",
                url: BASE_URL + "logout",
                withCredentials: true,
            });
            await queryClient.invalidateQueries({
                queryKey: ["authState"],
            });
            navigate({ to: "/" });
            justLoggedIn && dispatch(infoBarActions.hideLoggedInBar());
            justRegistered && dispatch(infoBarActions.hideRegisteredBar());
            dispatch(infoBarActions.showLoggedOutBar());
        } catch (error) {
            console.log(error);
        }
    };

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        staleTime: 1000 * 60,
    });

    useQuery({ queryKey: ["users"], queryFn: getUsers });

    const isAuthenticated = authStatus!.isAuthenticated;

    const router = useRouterState();
    const currentPath = router.location.pathname;

    const linkClassName = "text-lg rounded-md px-4 py-2 hover:bg-amber-300";
    const activeLinkClassName = linkClassName + " bg-amber-300";

    const userNameAbbreviation =
        `${authStatus?.userData?.firstName.charAt(0)}${authStatus?.userData?.lastName.charAt(0)}` ||
        null;

    return (
        <nav className="sticky top-0 bg-amber-50 w-full flex items-center justify-between p-5 z-10">
            <Link to="/">
                <span className="text-2xl text-amber-950 font-bold">
                    Beyond Reviews
                </span>
            </Link>
            <ul className="flex gap-10">
                {topLinks.map((item) => (
                    <li key={item.id}>
                        <Link
                            className={
                                currentPath.startsWith(item.link)
                                    ? activeLinkClassName
                                    : linkClassName
                            }
                            to={item.link}
                        >
                            {item.text}
                        </Link>
                    </li>
                ))}
            </ul>
            {isAuthenticated ? (
                <div className="flex">
                    <AccountMenu text={userNameAbbreviation as string} />
                    <MessageBox />
                    <Button style="dark" text="LOGOUT" handleClick={logout} />
                </div>
            ) : (
                <Button
                    text="LOGIN"
                    style="dark"
                    handleClick={() => navigate({ to: "/login" })}
                />
            )}
        </nav>
    );
};
