import { ToastContainer } from "react-toastify";

export const NotificationContainer = () => (
    <ToastContainer
        autoClose={3000}
        hideProgressBar
        toastStyle={{
            backgroundColor: "#bae6fd",
            paddingBlock: 0,
            paddingInline: 20,
        }}
    />
);
