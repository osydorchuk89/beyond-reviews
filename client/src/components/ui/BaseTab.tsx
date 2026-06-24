interface BaseTabProps {
    children: React.ReactNode;
    isSelected: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const BaseTab = ({ children, isSelected, onClick }: BaseTabProps) => {
    return (
        <button
            className={`cursor-pointer px-5 py-2 rounded-lg font-semibold transition-colors ${
                isSelected
                    ? "bg-sky-700 text-white"
                    : "bg-sky-100 text-sky-800 hover:bg-sky-200"
            }`}
            type="button"
            onClick={onClick}
        >
            {children}
        </button>
    );
};
