import { useFetcher } from "react-router";
import { BaseButton } from "./BaseButton";

export const LogoutButton = () => {
    const fetcher = useFetcher({ key: "logout" });
    const pending = fetcher.state !== "idle";

    return (
        <BaseButton
            style="orange"
            aria-disabled={pending}
            aria-busy={pending}
            handleClick={() => {
                if (pending) return;
                fetcher.submit(null, { method: "post", action: "/logout" });
            }}
        >
            LOGOUT
        </BaseButton>
    );
};
