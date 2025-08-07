import { BaseButton } from "./BaseButton";
import { logout } from "../../lib/actions";
import { triggerAuthEvent } from "../../store";
import { useAppDispatch } from "../../store/hooks";
import { useNavigate } from "react-router";

export const LogoutButton = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleLogout = async () => {
        const response = await logout();
        if (response.data) {
            dispatch(triggerAuthEvent("loggedOut"));
            navigate("/");
        }
    };

    return (
        <BaseButton text="LOGOUT" style="orange" handleClick={handleLogout} />
    );
};
