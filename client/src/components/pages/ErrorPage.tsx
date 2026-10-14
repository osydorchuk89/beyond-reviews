import { useLayoutEffect } from "react";
import { useRouteError } from "react-router";

import { ButtonLink } from "../ui/ButtonLink";

export const ErrorPage = () => {
    // A loader error can render after the layout has set the normal route title.
    useLayoutEffect(() => {
        document.title = "Unable to load this page | Beyond Reviews";
    }, []);
    const error = useRouteError();
    const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
    return (
        <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
            <article className="flex flex-col gap-4 text-center text-xl">
                <h1
                    tabIndex={-1}
                    data-document-title="Unable to load this page"
                >
                    Unable to load this page
                </h1>
                <p>{errorMessage}</p>
                <p>Please try again later.</p>
            </article>
            <ButtonLink to="/" style="orange">
                BACK TO HOME PAGE
            </ButtonLink>
        </div>
    );
};
