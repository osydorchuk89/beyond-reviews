import { useMemo } from "react";

import { User } from "../lib/entities";
import { useAuthData } from "./useAuthData";

export const useUserIdentity = (profileUser: User) => {
    const { user: visitingUser, authDataFetching } = useAuthData();

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
        isLoading: authDataFetching,
    };
};
