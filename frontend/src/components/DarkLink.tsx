import { Link } from "react-router-dom";

interface LinkProps {
    text: string;
    link: string;
}

export const DarkLink = ({ text, link }: LinkProps) => {
    return (
        <Link
            className="text-amber-700 font-bold hover:text-amber-950 hover:underline"
            to={link}
        >
            {text}
        </Link>
    );
};
