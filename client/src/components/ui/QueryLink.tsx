interface QueryLinkProps {
    text: string;
    onClick?: React.MouseEventHandler<HTMLSpanElement>;
}

export const QueryLink = ({ text, onClick }: QueryLinkProps) => {
    return (
        <a
            className="hover:text-sky-500 hover:underline cursor-pointer"
            onClick={onClick}
        >
            {text}
        </a>
    );
};
