import { ButtonLink } from "../ui/ButtonLink";

export const NotFoundPage = () => {
    return (
        <div className="flex flex-col justify-center items-center gap-12 min-h-[80vh]">
            <article className="flex flex-col gap-4 text-center text-xl">
                <h2>Uh oh!</h2>
                <h2>There is no such page...</h2>
            </article>
            <ButtonLink to="/" style="orange">
                BACK TO HOME PAGE
            </ButtonLink>
        </div>
    );
};
