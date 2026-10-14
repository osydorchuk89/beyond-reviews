import type { ComponentPropsWithRef } from "react";
import { Link } from "react-router";

import type { LocationState } from "../../lib/entities";
import { buttonStyles } from "../../styles/buttonStyles";

interface ButtonLinkProps
    extends Omit<ComponentPropsWithRef<typeof Link>, "style" | "state"> {
    style: "orange" | "sky" | "disabled";
    state?: LocationState;
}

export const ButtonLink = ({
    style,
    to,
    children,
    state,
    className,
    ...props
}: ButtonLinkProps) => {
    return (
        <Link
            {...props}
            className={[buttonStyles[style], className]
                .filter(Boolean)
                .join(" ")}
            to={to}
            state={state}
        >
            {children}
        </Link>
    );
};
