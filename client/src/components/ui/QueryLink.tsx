interface QueryLinkProps {
    text: string;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

export const QueryLink = ({ text, onClick }: QueryLinkProps) => {
    return (
        <span
            className="hover:text-sky-500 hover:underline cursor-pointer"
            onClick={onClick}
        >
            {text}
        </span>
    );
};
