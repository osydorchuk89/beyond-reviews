import type { UIMatch } from "react-router";
import type { User } from "./entities";

export interface PageHandle {
    title: string | ((data: unknown) => string);
}

export function getPageMetadata(matches: UIMatch[]) {
    const page = [...matches]
        .reverse()
        .find((match) => (match.handle as PageHandle | undefined)?.title);
    const handle = page?.handle as PageHandle | undefined;
    const title =
        typeof handle?.title === "function"
            ? handle.title(page?.data)
            : (handle?.title ?? "Beyond Reviews");
    const profile = matches.find((match) => match.id === "userProfile")?.data as
        | { user?: User }
        | undefined;
    const name = profile?.user
        ? `${profile.user.firstName} ${profile.user.lastName}`
        : undefined;
    return {
        title,
        documentTitle: `${title}${name ? ` — ${name}` : ""} | Beyond Reviews`,
    };
}
