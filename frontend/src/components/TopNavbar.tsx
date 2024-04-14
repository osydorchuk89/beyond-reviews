import axios from "axios";
import { Link } from "@tanstack/react-router";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { authActions } from "../store";
import { Button } from "./Button";
import { AccountMenu } from "./AccountMenu";
import { BASE_URL } from "../lib/urls";

const topLinks = [
    { id: 1, text: "Books", link: "#" },
    { id: 2, text: "Movies", link: "/movies" },
    { id: 3, text: "Music", link: "#" },
];

export const TopNavBar = () => {
    const { isAuthenticated, userData } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const router = useRouterState();
    const currentPath = router.location.pathname;

    const linkClassName = "text-lg rounded-md px-4 py-2 hover:bg-amber-300";
    const activeLinkClassName = linkClassName + " bg-amber-300";

    const userNameAbbreviation =
        `${userData?.firstName.charAt(0)}${userData?.lastName.charAt(0)}` ||
        null;

    return (
        <nav className="sticky top-0 bg-amber-50 w-full flex items-center justify-between p-5">
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
                    <Button
                        style="dark"
                        text="LOGOUT"
                        handleClick={() => {
                            axios({
                                method: "get",
                                url: BASE_URL + "logout",
                                withCredentials: true,
                            })
                                .then(() => dispatch(authActions.logout()))
                                .catch((error) => console.log(error));
                        }}
                    />
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
