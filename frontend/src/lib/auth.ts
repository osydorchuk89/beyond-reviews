import { redirect } from "@tanstack/react-router";
import { getAuthStatus, queryClient } from "./requests";
import { AuthStatus } from "./types";

export const isAuthenticated = async () => {
    const authStatus = await queryClient.fetchQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });
    const isAuthenticated = authStatus.isAuthenticated;
    if (!isAuthenticated) {
        throw redirect({
            to: "/login",
            search: {
                redirect: location.href,
            },
        });
        // router.history.push(search.redirect);
    }
};
