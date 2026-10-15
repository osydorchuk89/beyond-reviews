import { useEffect } from "react";
import { toast } from "react-toastify";
import { ToastNotification } from "./ToastNotification";

interface ActionFeedbackProps {
    status: string;
    error: string;
}

export const ActionFeedback = ({ status, error }: ActionFeedbackProps) => {
    useEffect(() => {
        if (!error) return;
        const returnFocusTo = document.activeElement;
        const toastId = toast(
            ({ closeToast }) => (
                <ToastNotification text={error} closeToast={closeToast} />
            ),
            {
                autoClose: false,
                closeButton: false,
                closeOnClick: false,
                draggable: false,
                role: "alert",
                onClose: () => {
                    const notification = document.getElementById(
                        String(toastId),
                    );
                    if (
                        notification?.contains(document.activeElement) &&
                        returnFocusTo instanceof HTMLElement &&
                        returnFocusTo.isConnected
                    ) {
                        returnFocusTo.focus();
                    }
                },
            },
        );

        // A retry clears the error; navigation removes its source. Retire only
        // this notification, leaving unrelated failures available to dismiss.
        return () => {
            toast.dismiss(toastId);
        };
    }, [error]);

    // The toast owns the error alert so it is not announced in two places.
    return (
        <p role="status" className="sr-only">
            {status}
        </p>
    );
};
