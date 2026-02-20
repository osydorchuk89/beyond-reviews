import { ReactNode } from "react";
import { NavLink, To } from "react-router";

interface HeaderNavLinkProps {
    to: To;
    children: ReactNode;
}

export const HeaderNavLink = ({
    to,
    children,
}: HeaderNavLinkProps) => {
    return (
        <NavLink
            className={({ isActive }) =>
                `text-xl hover:text-orange-500 before:content-[attr(data-text)] before:font-semibold before:block before:h-0 before:overflow-hidden before:invisible ${
                    isActive && "text-orange-500 font-semibold"
                }`
            }
            to={to}
        >
            {children}
        </NavLink>
    );
};
