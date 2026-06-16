export const FriendRecommendationsLoadingSection = () => {
    return (
        <section className="flex flex-col gap-6 w-full rounded-xl bg-fuchsia-100 p-4 sm:p-6">
            <h3 className="text-xl text-center text-fuchsia-950 font-bold">
                Suggested friends
            </h3>
            <div className="flex flex-col items-center gap-4 rounded-lg border border-fuchsia-200 bg-white/70 p-5 text-center text-fuchsia-950">
                <div className="h-8 w-8 rounded-full border-4 border-fuchsia-400 border-t-transparent animate-spin" />
                <p className="font-semibold">
                    Finding people with similar taste...
                </p>
                <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                    {[0, 1, 2].map((item) => (
                        <div
                            key={item}
                            className="flex flex-col items-center gap-3 rounded-lg bg-fuchsia-50 p-4"
                        >
                            <div className="h-14 w-14 rounded-full bg-fuchsia-200/70 animate-pulse" />
                            <div className="h-3 w-24 rounded bg-fuchsia-200/70 animate-pulse" />
                            <div className="h-3 w-32 rounded bg-fuchsia-200/70 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
