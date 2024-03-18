interface ButtonProps {
    text: string;
    type?: "submit" | "reset" | "button" | undefined;
    handleClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const DarkButton = ({ text, type, handleClick }: ButtonProps) => {
    return (
        <button
            className="px-8 py-2 rounded-md text-amber-50 bg-amber-700 hover:bg-amber-900 text-lg"
            type={type}
            onClick={handleClick}
        >
            {text}
        </button>
    );
};
