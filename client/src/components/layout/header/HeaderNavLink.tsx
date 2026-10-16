import type { ComponentPropsWithRef } from "react";
import { NavLink } from "react-router";

type HeaderNavLinkProps = ComponentPropsWithRef<typeof NavLink>;

export const HeaderNavLink = ({
    to,
    children,
    className,
    ...props
}: HeaderNavLinkProps) => {
    return (
        <NavLink
            {...props}
            className={(state) =>
                `text-xl hover:text-orange-200 before:content-[attr(data-text)] before:font-semibold before:block before:h-0 before:overflow-hidden before:invisible ${
                    state.isActive ? "text-orange-200 font-semibold" : ""
                } ${typeof className === "function" ? className(state) : (className ?? "")}`
            }
            to={to}
        >
            {children}
        </NavLink>
    );
};
