export const LoadingSpinner = ({ announce = true }: { announce?: boolean }) => {
    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            {announce && (
                <span role="status" className="sr-only">
                    Loading…
                </span>
            )}
            <div className="flex flex-1 items-center justify-center">
                <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
};
