import { useState } from "react";

interface CloseIconAltProps {
    className: string;
    handleClick?: React.MouseEventHandler<SVGSVGElement>;
}

export const CloseIconAlt = ({ className, handleClick }: CloseIconAltProps) => {
    const [mouseOver, setMouseOver] = useState(false);

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke={mouseOver ? "#451a03" : "#d97706"}
            className={className}
            onMouseEnter={() => setMouseOver(true)}
            onMouseLeave={() => setMouseOver(false)}
            onClick={handleClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
        </svg>
    );
};
