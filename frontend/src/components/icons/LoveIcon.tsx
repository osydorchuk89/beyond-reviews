interface LoveIconProps {
    color: string;
    handleClick?: React.MouseEventHandler<SVGSVGElement>;
    handleMouseEnter?: React.MouseEventHandler<SVGSVGElement>;
    handleMouseLeave?: React.MouseEventHandler<SVGSVGElement>;
}

export const LoveIcon = ({
    color,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
}: LoveIconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill={color}
            viewBox="0 0 24 24"
            strokeWidth="1.2"
            stroke="#f59e0b"
            className="w-8 h-8 cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
        </svg>
    );
};
