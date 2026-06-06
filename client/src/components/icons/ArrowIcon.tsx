interface ArrowIconProps {
    direction: "left" | "right";
    onClick: () => void;
    disabled?: boolean;
}

export const ArrowIcon = ({
    onClick,
    direction,
    disabled = false,
}: ArrowIconProps) => {
    const label =
        direction === "left"
            ? "Scroll recommendations left"
            : "Scroll recommendations right";

    return (
        <button
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-fuchsia-700 text-white hover:bg-fuchsia-800 disabled:cursor-not-allowed disabled:bg-fuchsia-300 disabled:text-fuchsia-50"
            onClick={onClick}
            type="button"
            aria-label={label}
            disabled={disabled}
        >
            <svg
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
