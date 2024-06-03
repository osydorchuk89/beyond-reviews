import { redirect } from "@tanstack/react-router";
import { getAuthStatus, queryClient } from "./requests";
import { AuthStatus } from "./types";

export const redirectIfNotAuthenticated = async () => {
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
    }
};

export const redirectIfAuthenticated = async () => {
    const authStatus = await queryClient.fetchQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });
    const isAuthenticated = authStatus.isAuthenticated;
    if (isAuthenticated) {
        throw redirect({
            to: "/",
            search: {
                redirect: location.href,
            },
        });
    }
};
