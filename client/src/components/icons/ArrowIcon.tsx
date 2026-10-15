import type { ComponentPropsWithRef } from "react";

interface ArrowIconProps extends ComponentPropsWithRef<"button"> {
    direction: "left" | "right";
    onClick: () => void;
    disabled?: boolean;
}

export const ArrowIcon = ({
    onClick,
    direction,
    disabled = false,
    className,
    "aria-label": accessibleLabel,
    ...props
}: ArrowIconProps) => {
    const label =
        direction === "left"
            ? "Scroll recommendations left"
            : "Scroll recommendations right";

    return (
        <button
            {...props}
            className={`flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-fuchsia-700 text-white hover:bg-fuchsia-800 aria-disabled:cursor-not-allowed aria-disabled:bg-fuchsia-300 aria-disabled:text-fuchsia-50 ${className ?? ""}`}
            onClick={() => {
                if (!disabled) onClick();
            }}
            type="button"
            aria-label={accessibleLabel ?? label}
            aria-disabled={disabled}
        >
            <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
            >
                {direction === "left" ? (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                    />
                ) : (
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                )}
            </svg>
        </button>
    );
};
