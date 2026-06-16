export const MovieRecommendationsLoadingSection = () => {
    return (
        <section className="flex flex-col gap-6 w-full rounded-xl bg-fuchsia-100 p-4 sm:p-6">
            <h2 className="text-xl text-center text-fuchsia-950 font-bold">
                Recommended for you
            </h2>
            <div className="flex flex-col items-center gap-4 rounded-lg border border-fuchsia-200 bg-white/70 p-5 text-center text-fuchsia-950">
                <div className="h-8 w-8 rounded-full border-4 border-fuchsia-400 border-t-transparent animate-spin" />
                <p className="font-semibold">Finding picks for you...</p>
                <div className="flex w-full max-w-3xl gap-4 overflow-hidden">
                    {[0, 1, 2].map((item) => (
                        <div
                            key={item}
                            className="flex min-w-28 flex-1 flex-col gap-3"
                        >
                            <div className="aspect-[2/3] w-full rounded-lg bg-fuchsia-200/70 animate-pulse" />
                            <div className="h-3 rounded bg-fuchsia-200/70 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
