import type { ComponentPropsWithRef } from "react";
import { buttonStyles } from "../../styles/buttonStyles";

interface BaseButtonProps
    extends Omit<ComponentPropsWithRef<"button">, "style"> {
    style: keyof typeof buttonStyles;
    children: React.ReactNode;
    type?: "submit" | "reset" | "button";
    disabled?: boolean;
    handleClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const BaseButton = ({
    style,
    children,
    type = "button",
    handleClick,
    onClick,
    className,
    ...props
}: BaseButtonProps) => {
    return (
        <button
            {...props}
            className={[buttonStyles[style], className]
                .filter(Boolean)
                .join(" ")}
            onClick={handleClick ?? onClick}
            type={type}
        >
            {children}
        </button>
    );
};
