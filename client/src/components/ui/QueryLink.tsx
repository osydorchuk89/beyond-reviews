interface QueryLinkProps {
    children: React.ReactNode;
    isBold?: boolean;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

export const QueryLink = ({
    children,
    isBold = false,
    onClick,
}: QueryLinkProps) => {
    return (
        <a
            className={`${isBold && "text-lg"} text-sky-800 hover:text-sky-500 ${isBold && "font-medium"} hover:underline cursor-pointer`}
            onClick={onClick}
        >
            {children}
        </a>
    );
};
