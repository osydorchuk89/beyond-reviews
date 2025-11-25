import {
    Outlet,
    useNavigate,
    useParams,
    useRouteLoaderData,
} from "react-router";

import { BaseButton } from "../../ui/BaseButton";
import { AuthData } from "../../../lib/entities";

export const UserLayout = () => {
    const navigate = useNavigate();
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
                    <BaseButton
                        text="BACK TO YOUR PROFILE"
                        style="orange"
                        handleClick={() =>
                            navigate(`/users/${visitingUser.id}/profile`)
                        }
                    />
                </div>
            )}
        </div>
    );
};
