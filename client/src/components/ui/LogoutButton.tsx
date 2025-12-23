import { useFetcher } from "react-router";
import { BaseButton } from "./BaseButton";

export const LogoutButton = () => {
    const fetcher = useFetcher();

    return (
        <BaseButton
            style="orange"
            handleClick={() => {
                fetcher.submit(null, { method: "post", action: "/logout" });
            }}
        >
            LOGOUT
        </BaseButton>
    );
};
