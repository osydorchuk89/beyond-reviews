import { CloseIcon } from "../../icons/CloseIcon";

interface LoginErrorAlertProps {
    message: string;
    onClose?: () => void;
}

export const LoginErrorAlert = ({ message, onClose }: LoginErrorAlertProps) => {
    return (
        <div className="flex justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-5 rounded absolute top-[120px]">
            <span className="block sm:inline">{message}</span>
            <button
                className="ml-3"
                onClick={onClose}
                data-testid="close-button"
            >
                <CloseIcon style="dark" />
            </button>
        </div>
    );
};
