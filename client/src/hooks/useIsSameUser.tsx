import { AuthData, User } from "../lib/entities";
import { useRouteLoaderData } from "react-router";

export const useIsSameUser = (profileUser: User) => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const visitingUser = authData.user;

    const isSameUser = visitingUser
        ? profileUser.id === visitingUser.id
        : false;

    const profileUserName = `${profileUser.firstName} ${profileUser.lastName}`;

    return {
        visitingUser,
        isSameUser,
        profileUserName,
    };
};
