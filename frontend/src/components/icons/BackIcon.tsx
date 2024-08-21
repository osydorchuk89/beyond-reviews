interface BackIconProps {
    className: string;
    handleClick?: React.MouseEventHandler<SVGSVGElement>;
}

import { useState } from "react";

export const BackIcon = ({ className, handleClick }: BackIconProps) => {
    const [mouseOver, setMouseOver] = useState(false);
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke={mouseOver ? "#451a03" : "#d97706"}
            onMouseEnter={() => setMouseOver(true)}
            onMouseLeave={() => setMouseOver(false)}
            onClick={handleClick}
            className={className}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
            />
        </svg>
    );
};
