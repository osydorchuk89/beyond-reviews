interface QueryLinkProps {
    children: React.ReactNode;
    isBold?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const QueryLink = ({
    children,
    isBold = false,
    onClick,
}: QueryLinkProps) => {
    return (
        <button
            type="button"
            className={`${isBold && "text-lg"} text-sky-800 hover:text-sky-700 ${isBold && "font-medium"} hover:underline cursor-pointer`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};
