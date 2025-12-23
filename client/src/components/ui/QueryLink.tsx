interface QueryLinkProps {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

export const QueryLink = ({ children, onClick }: QueryLinkProps) => {
    return (
        <a
            className="hover:text-sky-500 hover:underline cursor-pointer"
            onClick={onClick}
        >
            {children}
        </a>
    );
};
