import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";

import { ButtonLink } from "../ui/ButtonLink";
import { BaseButton } from "../ui/BaseButton";
import { Footer } from "../layout/footer/Footer";

export const ErrorPage = () => {
    const viewRef = useRef<HTMLDivElement>(null);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const inFlight = useRef(false);
    const revalidator = useRevalidator();
    const [status, setStatus] = useState("");
    const pending = revalidator.state !== "idle";

    useEffect(() => {
        if (pending) setStatus("Trying again…");
        else {
            // Only a committed error screen can announce another failure. The
            // revalidation promise may finish before a successful page commits.
            setStatus((previous) =>
                previous === "Trying again…"
                    ? "Still unable to load this page. Please try again."
                    : previous,
            );
        }
    }, [pending]);

    // A loader error can render after the layout has set the normal route title.
    useLayoutEffect(() => {
        document.title = "Unable to load this page | Beyond Reviews";
        const frame = requestAnimationFrame(() => headingRef.current?.focus());
        return () => {
            cancelAnimationFrame(frame);
            const focusedElement = document.activeElement;
            if (!viewRef.current?.contains(focusedElement)) return;
            // Run after the replacement page commits, including when a retry
            // keeps the same URL. Leave other controls' focus alone.
            requestAnimationFrame(() => {
                if (
                    focusedElement &&
                    !focusedElement.isConnected &&
                    document.activeElement === document.body
                ) {
                    document.querySelector<HTMLElement>("main h1")?.focus();
                }
            });
        };
    }, []);

    const retry = async () => {
        if (inFlight.current || pending) return;
        inFlight.current = true;
        try {
            // Re-run loaders only: never replay a failed form submission.
            await revalidator.revalidate();
        } finally {
            inFlight.current = false;
        }
    };

    return (
        <div
            ref={viewRef}
            className="flex flex-col justify-center items-center gap-12 min-h-[80vh] px-4"
        >
            <article className="flex flex-col gap-4 text-center text-xl">
                <h1
                    ref={headingRef}
                    tabIndex={-1}
                    data-document-title="Unable to load this page"
                >
                    Unable to load this page
                </h1>
                <p>Please try again or return to the home page.</p>
            </article>
            <div className="flex flex-wrap justify-center gap-4">
                <BaseButton
                    style="orange"
                    aria-disabled={pending}
                    aria-busy={pending}
                    handleClick={retry}
                >
                    TRY AGAIN
                </BaseButton>
                <ButtonLink to="/" style="orange">
                    BACK TO HOME PAGE
                </ButtonLink>
            </div>
            <p role="status" className="sr-only" aria-atomic="true">
                {status}
            </p>
        </div>
    );
};

// Root data is unavailable here, so the normal authenticated header cannot
// render safely. Keep a main landmark and the existing footer during recovery.
export const RootErrorPage = () => (
    <>
        <main id="main-content" tabIndex={-1}>
            <ErrorPage />
        </main>
        <Footer />
    </>
);
