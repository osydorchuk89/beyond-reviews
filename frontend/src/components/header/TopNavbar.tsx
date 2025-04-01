import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { Button } from "../Button";
import { AccountMenu } from "./AccountMenu";
import { BASE_URL } from "../../lib/urls";
import { MessageBox } from "../messageBox/MessageBox";
import { getAuthStatus, getUser, queryClient } from "../../lib/requests";
import { AuthStatus, User } from "../../lib/types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { dropDownMenuActions, infoBarActions } from "../../store";
import { MenuIcon } from "../icons/MenuIcon";
import { CloseIcon } from "../icons/CloseIcon";

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
    const { isOpen } = useAppSelector((state) => state.dropDownMenu);

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
            dispatch(dropDownMenuActions.closeDropDownMenu());
        } catch (error) {
            console.log(error);
        }
    };

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: async () => {
            const data = await getAuthStatus();
            if (data.userData) {
                const userId = data.userData._id;
                useQuery<User>({
                    queryKey: ["users", { user: userId }],
                    queryFn: () => getUser(userId),
                });
            }
            return data;
        },
        staleTime: 1000 * 60,
    });

    const isAuthenticated = !!authStatus?.isAuthenticated;

    const router = useRouterState();
    const currentPath = router.location.pathname;

    const linkClassName = "text-lg rounded-md px-4 py-2 hover:bg-amber-300";
    const activeLinkClassName = linkClassName + " bg-amber-300";

    const dropDownMenuItemClassName =
        "w-full flex justify-center text-xl py-2 hover:bg-amber-300";

    const dropDownMenuDisplay = isOpen ? "" : "hidden";
    const dropDownMenuClassName =
        "flex items-center justify-center md:hidden " + dropDownMenuDisplay;

    const userNameAbbreviation =
        `${authStatus?.userData?.firstName.charAt(0)}${authStatus?.userData?.lastName.charAt(0)}` ||
        null;

    return (
        <div className="sticky top-0 bg-amber-50 w-full z-10">
            <nav className="flex items-center justify-between px-10 md:px-5 py-5">
                <Link to="/">
                    <span className="text-2xl text-amber-950 font-bold hover:text-amber-700">
                        Beyond Reviews
                    </span>
                </Link>
                <ul className="hidden md:flex md:gap-2 lg:gap-10">
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
                    <div className="hidden md:flex">
                        <AccountMenu text={userNameAbbreviation as string} />
                        <MessageBox />
                        <Button
                            style="dark"
                            text="LOGOUT"
                            handleClick={logout}
                        />
                    </div>
                ) : (
                    <div className="hidden md:block">
                        <Button
                            text="LOGIN"
                            style="dark"
                            handleClick={() => navigate({ to: "/login" })}
                        />
                    </div>
                )}
                <div className="flex flex-col md:hidden">
                    {isOpen ? (
                        <CloseIcon
                            className="size-8 hover:bg-amber-300 hover:rounded-md hover:cursor-pointer"
                            handleClick={() =>
                                dispatch(
                                    dropDownMenuActions.closeDropDownMenu()
                                )
                            }
                        />
                    ) : (
                        <MenuIcon
                            handleClick={() =>
                                dispatch(dropDownMenuActions.openDropDownMenu())
                            }
                        />
                    )}
                </div>
            </nav>
            <nav className={dropDownMenuClassName}>
                <ul className="flex flex-col w-full">
                    {topLinks.map((item) => (
                        <li key={item.id}>
                            <Link
                                className={dropDownMenuItemClassName}
                                onClick={() =>
                                    dispatch(
                                        dropDownMenuActions.closeDropDownMenu()
                                    )
                                }
                                to={item.link}
                            >
                                {item.text}
                            </Link>
                        </li>
                    ))}
                    <li>
                        {isAuthenticated ? (
                            <Link
                                className={dropDownMenuItemClassName}
                                onClick={logout}
                            >
                                Logout
                            </Link>
                        ) : (
                            <Link
                                className={dropDownMenuItemClassName}
                                to="/login"
                                onClick={() =>
                                    dispatch(
                                        dropDownMenuActions.closeDropDownMenu()
                                    )
                                }
                            >
                                Login
                            </Link>
                        )}
                    </li>
                </ul>
            </nav>
        </div>
    );
};
