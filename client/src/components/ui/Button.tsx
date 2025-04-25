interface ButtonProps {
    text: string;
    style: "orange" | "sky" | "disabled";
    type?: "submit" | "reset" | "button" | undefined;
    disabled?: boolean;
    handleClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

export const Button = ({
    text,
    style,
    type,
    disabled,
    handleClick,
}: ButtonProps) => {
    const styles = {
        orange: "cursor-pointer bg-orange-300 rounded-lg text-sky-950 font-bold px-8 py-3 hover:bg-orange-400 hover:text-sky-950",
        sky: "cursor-pointer bg-sky-600 rounded-lg text-white px-8 py-3 hover:bg-sky-800",
        disabled: "bg-gray-500 rounded-lg text-white px-8 py-3",
    };
    return (
        <button
            className={styles[style]}
            onClick={handleClick}
            type={type}
            disabled={disabled}
        >
            {text}
        </button>
    );
};
