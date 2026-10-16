import type { ComponentPropsWithRef } from "react";

interface CloseIconProps
    extends Omit<ComponentPropsWithRef<"button">, "style"> {
    handleClick?: () => void;
    style: "dark" | "light";
}

export const CloseIcon = ({
    handleClick,
    style,
    onClick,
    className,
    ...props
}: CloseIconProps) => {
    return (
        <button
            type="button"
            aria-label="Close"
            {...props}
            className={["shrink-0", className].filter(Boolean).join(" ")}
            onClick={handleClick ?? onClick}
        >
            <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className={`w-6 h-6 cursor-pointer ${style === "light" ? "text-white" : "text-orange-800 hover:text-orange-900"} `}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                />
            </svg>
        </button>
    );
};
