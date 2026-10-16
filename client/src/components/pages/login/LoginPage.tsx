import { useState, useEffect, useRef } from "react";
import { useActionData, useNavigation } from "react-router";
import { LoginErrorAlert } from "./LoginErrorAlert";
import { LoginForm } from "./LoginForm";

export const LoginPage = () => {
    const actionData = useActionData() as { error?: string } | undefined;
    const [showError, setShowError] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigation = useNavigation();

    useEffect(() => {
        if (actionData?.error) {
            setShowError(true);
        }
    }, [actionData]);

    return (
        <div className="flex flex-col justify-center items-center py-10 min-h-[720px]">
            <div
                ref={containerRef}
                className="flex flex-col justify-center items-center"
            >
                {showError &&
                    navigation.state === "idle" &&
                    actionData?.error && (
                        <LoginErrorAlert
                            message={actionData.error}
                            onClose={() => {
                                setShowError(false);
                                containerRef.current
                                    ?.querySelector<HTMLInputElement>(
                                        'input[autocomplete="username"]',
                                    )
                                    ?.focus();
                            }}
                        />
                    )}
                <LoginForm />
            </div>
        </div>
    );
};
