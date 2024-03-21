import axios from "axios";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { authActions } from "../store";
import { DarkButton } from "./DarkButton";
import { BASE_URL } from "../lib/urls";

const topLinks = [
    { id: 1, text: "Books", link: "#" },
    { id: 2, text: "Movies", link: "#" },
    { id: 3, text: "Music", link: "#" },
];

export const TopNavBar = () => {
    const authData = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    console.log(authData);

    return (
        <nav className="sticky top-0 z-10 bg-amber-50 w-full flex items-center justify-between p-5">
            <Link to="/">
                <span className="text-2xl font-bold">Beyond Reviews</span>
            </Link>
            <ul className="flex gap-10">
                {topLinks.map((item) => (
                    <li key={item.id}>
                        <a
                            className="text-lg rounded-md px-4 py-2 hover:bg-amber-300"
                            href={item.link}
                        >
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
            {authData.isAuthenticated ? (
                <DarkButton
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
            ) : (
                <DarkButton
                    text="LOGIN"
                    handleClick={() => navigate({ to: "/login" })}
                />
            )}
        </nav>
    );
};
