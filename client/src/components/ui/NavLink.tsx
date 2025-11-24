import { Link, RelativeRoutingType } from "react-router";
import { LocationState } from "../../lib/entities";

interface NavLinkProps {
    to: string;
    text: string;
    relative?: RelativeRoutingType;
    state?: LocationState;
}

export const NavLink = ({
    to,
    text,
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
            {text}
        </Link>
    );
};
