import type { ComponentPropsWithRef } from "react";
import { Link } from "react-router";
import type { LocationState } from "../../lib/entities";

interface BaseLinkProps
    extends Omit<ComponentPropsWithRef<typeof Link>, "state"> {
    state?: LocationState;
}

export const BaseLink = ({
    to,
    children,
    relative = "route",
    state,
    className,
    ...props
}: BaseLinkProps) => {
    return (
        <Link
            {...props}
            className={[
                "text-sky-800 hover:text-sky-950 hover:underline",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            to={to}
            relative={relative}
            state={state}
        >
            {children}
        </Link>
    );
};
