import { Outlet, useParams, useRouteLoaderData } from "react-router";

import { AuthData } from "../../../lib/entities";
import { ButtonLink } from "../../ui/ButtonLink";

export const UserLayout = () => {
    const { userId: profileUserId } = useParams() as { userId: string };

    const { authData } = useRouteLoaderData("root") as {
        authData: AuthData;
    };
    const visitingUser = authData.user;

    const isSameUser = visitingUser && profileUserId === visitingUser.id;

    return (
        <div className="flex flex-col items-center gap-6 my-10 mx-48">
            <Outlet key={profileUserId} />
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
