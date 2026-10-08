import {
    Link,
    Outlet,
    useLoaderData,
    useNavigation,
    useRouteLoaderData,
} from "react-router";

import type { AuthData, User } from "../../../lib/entities";
import { horizontalPadding } from "../../../styles/responsive";
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
    const nextPathname = navigation.location?.pathname;
    const isNavigatingInsideUserProfile =
        navigation.state === "loading" &&
        nextPathname?.startsWith(`/users/${profileUser.id}/`);
    const isLeavingUserProfile =
        navigation.state === "loading" &&
        nextPathname !== undefined &&
        !nextPathname.startsWith(`/users/${profileUser.id}/`);

    if (isLeavingUserProfile) {
        return (
            <div className="flex min-h-[70vh] w-full items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col items-center gap-6 my-6 sm:my-10 w-full mx-auto ${horizontalPadding.page}`}
        >
            <Link
                className="text-center text-xl sm:text-2xl font-bold break-words"
                to={`/users/${profileUser.id}/profile`}
                relative="route"
            >
                {profileUserFullName}
            </Link>
            {isNavigatingInsideUserProfile ? (
                <LoadingSpinner />
            ) : (
                <Outlet key={profileUser.id} />
            )}
            {visitingUser && !isSameUser && (
                <div>
                    <ButtonLink
                        style="sky"
                        to={`/users/${visitingUser.id}/profile`}
                    >
                        BACK TO YOUR PROFILE
                    </ButtonLink>
                </div>
            )}
        </div>
    );
};
