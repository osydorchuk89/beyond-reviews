import { useState } from "react";
import { useNavigate, useLocation } from "react-router";

import { sendLoginData } from "../../../lib/actions";
import { useAppDispatch } from "../../../store/hooks";
import { triggerAuthEvent } from "../../../store";
import { LoginErrorAlert } from "./LoginErrorAlert";
import { LoginForm } from "./LoginForm";

interface LoginInputs {
    email: string;
    password: string;
}

export const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const [fetching, setFetching] = useState(false);
    const [invalidCredentials, setInvalidCredentials] = useState(false);

    const handleLogin = async (data: LoginInputs) => {
        setFetching(true);

        try {
            const response = await sendLoginData(data);

            if (response.status === 401) {
                setInvalidCredentials(true);
            } else if (response.status === 200) {
                setInvalidCredentials(false);
                dispatch(triggerAuthEvent("loggedIn"));
                navigate(-1);

                setTimeout(() => {
                    if (location.pathname === "/login") {
                        navigate("/", { replace: true });
                    }
                }, 100);
            }
        } catch (error) {
            console.error("Login error:", error);
            setInvalidCredentials(true);
        } finally {
            setFetching(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center py-10 h-[720px]">
            <div className="flex flex-col justify-center items-center">
                {invalidCredentials && (
                    <LoginErrorAlert
                        message="Invalid credentials"
                        onClose={() => setInvalidCredentials(false)}
                    />
                )}
                <LoginForm onSubmit={handleLogin} fetching={fetching} />
            </div>
        </div>
    );
};
