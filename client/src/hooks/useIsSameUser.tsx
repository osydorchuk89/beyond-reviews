import { useMemo } from "react";

import { AuthData, User } from "../lib/entities";
import { useRouteLoaderData } from "react-router";

export const useIsSameUser = (profileUser: User) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const visitingUser = authData.user;

    const isSameUser = useMemo(() => {
        if (!visitingUser) return false;
        return profileUser.id === visitingUser.id;
    }, [visitingUser, profileUser]);

    const profileUserName = useMemo(
        () => `${profileUser.firstName} ${profileUser.lastName}`,
        [profileUser]
    );

    return {
        visitingUser,
        isSameUser,
        profileUserName,
    };
};
