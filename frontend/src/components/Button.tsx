interface ButtonProps {
    text: string;
    style: string;
    type?: "submit" | "reset" | "button" | undefined;
    handleClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({ text, style, type, handleClick }: ButtonProps) => {
    const darkStyle =
        "px-8 py-2 rounded-md text-amber-50 bg-amber-700 hover:bg-amber-900 text-lg uppercase";

    return (
        <button
            className={style === "dark" ? darkStyle : style}
            type={type}
            onClick={handleClick}
        >
            {text}
        </button>
    );
};
