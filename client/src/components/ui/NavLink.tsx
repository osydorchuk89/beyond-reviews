import { Link } from "react-router";

interface NavLinkProps {
    to: string;
    text: string;
}

export const NavLink = ({ to, text }: NavLinkProps) => {
    return (
        <Link className="hover:text-sky-500 hover:underline" to={to}>
            {text}
        </Link>
    );
};
