interface BookMarkIconProps {
    color: string;
    handleClick?: React.MouseEventHandler<SVGSVGElement>;
    handleMouseEnter?: React.MouseEventHandler<SVGSVGElement>;
    handleMouseLeave?: React.MouseEventHandler<SVGSVGElement>;
}

export const BookMarkIcon = ({
    color,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
}: BookMarkIconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={color}
            viewBox="0 0 24 24"
            strokeWidth="1.2"
            stroke="#f59e0b"
            className="size-8 cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
            />
        </svg>
    );
};
