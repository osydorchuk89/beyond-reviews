import { Outlet, useNavigate, useParams } from "react-router";

import { useAuthData } from "../../../hooks/useAuthData";
import { BaseButton } from "../../ui/BaseButton";

export const UserLayout = () => {
    const { userId: profileUserId } = useParams() as { userId: string };
    const { user: visitingUser } = useAuthData();
    const navigate = useNavigate();

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
