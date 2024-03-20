import { Link } from "react-router-dom";

interface LinkProps {
    text: string;
    to: string;
}

export const DarkLink = ({ text, to }: LinkProps) => {
    return (
        <Link
            className="text-amber-700 font-bold hover:text-amber-950 hover:underline"
            to={to}
        >
            {text}
        </Link>
    );
};
