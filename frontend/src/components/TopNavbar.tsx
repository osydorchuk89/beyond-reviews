import { Link } from "react-router-dom";
import { DarkButton } from "./DarkButton";

const topLinks = [
    { id: 1, text: "Books", link: "#" },
    { id: 2, text: "Movies", link: "#" },
    { id: 3, text: "Music", link: "#" },
];

export const TopNavBar = () => {
    return (
        <nav className="sticky top-0 z-10 bg-amber-50 w-full flex items-center justify-between p-5">
            <a href="/">
                <span className="text-2xl font-bold">Beyond Reviews</span>
            </a>
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
            <Link to="/login">
                <DarkButton text="LOGIN" />
            </Link>
        </nav>
    );
};
