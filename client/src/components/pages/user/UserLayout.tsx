import {
    Outlet,
    useLoaderData,
    useNavigation,
    useRouteLoaderData,
} from "react-router";

import { AuthData, User } from "../../../lib/entities";
import { ButtonLink } from "../../ui/ButtonLink";
import { LoadingSpinner } from "../../ui/LoadingSpinner";

export const UserLayout = () => {
    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const { user: profileUser } = useLoaderData() as {
        user: User;
    };
    const visitingUser = authData.user;
    const isSameUser = visitingUser && profileUser.id === visitingUser.id;

    const profileUserFullName = `${profileUser.firstName} ${profileUser.lastName}`;

    const navigation = useNavigation();
    const isLoading = navigation.state === "loading";

    return (
        <div className="flex flex-col items-center gap-6 my-10 mx-48">
            <h2 className="text-center text-2xl font-bold">
                {profileUserFullName}
            </h2>
            {isLoading ? <LoadingSpinner /> : <Outlet key={profileUser.id} />}
            {visitingUser && !isSameUser && (
                <div>
                    <ButtonLink
                        style="orange"
                        to={`/users/${visitingUser.id}/profile`}
                    >
                        BACK TO YOUR PROFILE
                    </ButtonLink>
                </div>
            )}
        </div>
    );
};
