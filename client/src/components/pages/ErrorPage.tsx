import { useRouteError } from "react-router";

import { ButtonLink } from "../ui/ButtonLink";

export const ErrorPage = () => {
    const error = useRouteError();
    const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
    return (
        <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
            <article className="flex flex-col gap-4 text-center text-xl">
                <h2>Oh no! {errorMessage}</h2>
                <h2>Please try again later.</h2>
            </article>
            <ButtonLink to="/" style="orange">
                BACK TO HOME PAGE
            </ButtonLink>
        </div>
    );
};
