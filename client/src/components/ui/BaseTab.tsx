import type { ComponentPropsWithRef } from "react";

interface BaseTabProps extends ComponentPropsWithRef<"button"> {
    children: React.ReactNode;
    isSelected: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const BaseTab = ({
    children,
    isSelected,
    className,
    type = "button",
    ...props
}: BaseTabProps) => {
    return (
        <button
            {...props}
            className={`cursor-pointer px-5 py-2 rounded-lg font-semibold transition-colors ${
                isSelected
                    ? "bg-sky-700 text-white"
                    : "bg-sky-100 text-sky-800 hover:bg-sky-200"
            } ${className ?? ""}`}
            type={type}
        >
            {children}
        </button>
    );
};
