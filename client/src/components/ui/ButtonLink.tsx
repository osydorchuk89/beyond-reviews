import { Link } from "react-router";

import type { LocationState } from "../../lib/entities";
import { buttonStyles } from "../../styles/buttonStyles";

interface ButtonLinkProps {
    style: "orange" | "sky" | "disabled";
    to: string;
    children: React.ReactNode;
    state?: LocationState;
}

export const ButtonLink = ({ style, to, children, state }: ButtonLinkProps) => {
    return (
        <Link className={buttonStyles[style]} to={to} state={state}>
            {children}
        </Link>
    );
};
