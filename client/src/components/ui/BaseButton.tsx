import { buttonStyles } from "../../styles/buttonStyles";

interface BaseButtonProps {
    text: string;
    style: "orange" | "sky" | "disabled";
    type?: "submit" | "reset" | "button" | undefined;
    disabled?: boolean;
    handleClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

export const BaseButton = ({
    text,
    style,
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
            {text}
        </button>
    );
};
