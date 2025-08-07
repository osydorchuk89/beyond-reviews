import { User } from "../lib/entities";
import { useAuthData } from "./useAuthData";

export const useUserIdentity = (user: User) => {
    const { authData, authDataFetching } = useAuthData();

    const isSameUser = authData.user && user.id === authData.user.id;
    const userName = `${user.firstName} ${user.lastName}`;

    return {
        isSameUser,
        userName,
        authData,
        isLoading: authDataFetching,
    };
};
