import { buttonStyles } from "../../styles/buttonStyles";

interface BaseButtonProps {
    style: keyof typeof buttonStyles;
    children: React.ReactNode;
    type?: "submit" | "reset" | "button";
    disabled?: boolean;
    handleClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const BaseButton = ({
    style,
    children,
    type,
    disabled,
    handleClick,
}: BaseButtonProps) => {
    return (
        <button
            className={buttonStyles[style]}
            onClick={handleClick}
            type={type}
            disabled={disabled}
        >
            {children}
        </button>
    );
};
