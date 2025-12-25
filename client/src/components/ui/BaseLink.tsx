import { Link, RelativeRoutingType } from "react-router";
import { LocationState } from "../../lib/entities";

interface BaseLinkProps {
    to: string;
    children: React.ReactNode;
    relative?: RelativeRoutingType;
    state?: LocationState;
}

export const BaseLink = ({
    to,
    children,
    relative = "route",
    state,
}: BaseLinkProps) => {
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
