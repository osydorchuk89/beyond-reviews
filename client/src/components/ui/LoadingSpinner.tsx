export const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <div className="flex flex-1 items-center justify-center">
                <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
};
