import { CloseIcon } from "../icons/CloseIcon";

interface ToastNotificationProps {
    text: string;
    closeToast: () => void;
}

export const ToastNotification = ({
    text,
    closeToast,
}: ToastNotificationProps) => {
    return (
        <div className="flex flex-row justify-between items-center w-full h-full flex-1">
            <p className="text-base text-sky-950">{text}</p>
            <CloseIcon style="dark" handleClick={closeToast} />
        </div>
    );
};
