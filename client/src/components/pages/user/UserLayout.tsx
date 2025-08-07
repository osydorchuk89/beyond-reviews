import { Outlet, useNavigate, useParams } from "react-router";

import { useAuthData } from "../../../hooks/useAuthData";
import { BaseButton } from "../../ui/BaseButton";

export const UserLayout = () => {
    const { userId } = useParams() as { userId: string };
    const { authData } = useAuthData();
    const navigate = useNavigate();

    const isSameUser = authData.user && userId === authData.user.id;

    return (
        <div className="flex flex-col items-center gap-6 my-10 mx-48">
            <Outlet key={userId} />
            {!isSameUser && (
                <div>
                    <BaseButton
                        text="BACK TO YOUR PROFILE"
                        style="orange"
                        handleClick={() =>
                            navigate(`/users/${authData.user.id}/profile`)
                        }
                    />
                </div>
            )}
        </div>
    );
};
