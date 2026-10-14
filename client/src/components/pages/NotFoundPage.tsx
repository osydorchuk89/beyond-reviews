import { ButtonLink } from "../ui/ButtonLink";

export const NotFoundPage = () => {
    return (
        <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
            <article className="flex flex-col gap-4 text-center text-xl">
                <h1 tabIndex={-1}>Page not found</h1>
                <p>There is no such page...</p>
            </article>
            <ButtonLink to="/" style="orange">
                BACK TO HOME PAGE
            </ButtonLink>
        </div>
    );
};
