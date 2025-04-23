interface ButtonProps {
    text: string;
    style: string;
    type?: "submit" | "reset" | "button" | undefined;
    disabled?: boolean;
    handleClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({
    text,
    style,
    type,
    disabled,
    handleClick,
}: ButtonProps) => {
    const orangeStyle =
        "cursor-pointer bg-orange-300 rounded-lg text-sky-950 font-bold px-8 py-3 hover:bg-orange-400 hover:text-sky-950";
    const skyStyle =
        "cursor-pointer bg-sky-600 rounded-lg text-white px-8 py-3 hover:bg-sky-800";
    return (
        <button
            className={style === "orange" ? orangeStyle : skyStyle}
            onClick={handleClick}
            type={type}
            disabled={disabled}
        >
            {text}
        </button>
    );
};
