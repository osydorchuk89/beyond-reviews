import { useState, useEffect } from "react";
import { useActionData } from "react-router";
import { LoginErrorAlert } from "./LoginErrorAlert";
import { LoginForm } from "./LoginForm";

export const LoginPage = () => {
    const actionData = useActionData() as { error?: string } | undefined;
    const [showError, setShowError] = useState(false);

    // TODO: Think if I need to be able to close LoginErrorAlert
    useEffect(() => {
        if (actionData?.error) {
            setShowError(true);
        }
    }, [actionData]);

    return (
        <div className="flex flex-col justify-center items-center py-10 h-[720px]">
            <div className="flex flex-col justify-center items-center">
                {showError && actionData?.error && (
                    <LoginErrorAlert
                        message={actionData.error}
                        onClose={() => setShowError(false)}
                    />
                )}
                <LoginForm />
            </div>
        </div>
    );
};
