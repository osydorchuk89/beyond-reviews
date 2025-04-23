import { Link, RelativeRoutingType } from "react-router";

interface NavLinkProps {
    to: string;
    text: string;
    relative?: RelativeRoutingType;
}

export const NavLink = ({ to, text, relative = "route" }: NavLinkProps) => {
    return (
        <Link
            className="text-sky-800 hover:text-sky-950 hover:underline"
            to={to}
            relative={relative}
        >
            {text}
        </Link>
    );
};
