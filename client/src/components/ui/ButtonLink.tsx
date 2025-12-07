import { Link } from "react-router";

import { LocationState } from "../../lib/entities";
import { buttonStyles } from "../../styles/buttonStyles";

interface ButtonLinkProps {
    text: string;
    style: "orange" | "sky" | "disabled";
    to: string;
    state?: LocationState;
}

export const ButtonLink = ({ text, style, to, state }: ButtonLinkProps) => {
    return (
        <Link className={buttonStyles[style]} to={to} state={state}>
            {text}
        </Link>
    );
};
