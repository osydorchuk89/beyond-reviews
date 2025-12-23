import { Link, RelativeRoutingType } from "react-router";
import { LocationState } from "../../lib/entities";

interface NavLinkProps {
    to: string;
    children: React.ReactNode;
    relative?: RelativeRoutingType;
    state?: LocationState;
}

export const NavLink = ({
    to,
    children,
    relative = "route",
    state,
}: NavLinkProps) => {
    return (
        <Link
            className="text-sky-800 hover:text-sky-950 hover:underline"
            to={to}
            relative={relative}
            state={state}
        >
            {children}
        </Link>
    );
};
