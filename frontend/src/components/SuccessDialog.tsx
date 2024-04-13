import { useAppSelector, useAppDispatch } from "../store/hooks";
import { dialogActions } from "../store";
import { Dialog } from "@headlessui/react";
import { Button } from "./Button";

interface CloseIconProps {
    handleClick: () => void;
}

const CloseIcon = ({ handleClick }: CloseIconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6 cursor-pointer absolute right-5"
            onClick={handleClick}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
            />
        </svg>
    );
};

export const SuccessDialog = () => {
    const dialogData = useAppSelector((state) => state.dialog);
    const dispatch = useAppDispatch();

    return (
        <Dialog
            open={dialogData.isOpen}
            onClose={() => dispatch(dialogActions.close())}
        >
            <div className="fixed inset-0 bg-black/75" aria-hidden="true" />
            <div className="fixed inset-0 flex w-screen items-center justify-center">
                <Dialog.Panel className="rounded-xl bg-white w-[480px] shadow-md">
                    <Dialog.Title className="flex rounded-xl rounded-b-none bg-amber-500 py-5 relative justify-center shadow-md">
                        <span className="text-xl font-bold">Success</span>
                        <CloseIcon
                            handleClick={() => dispatch(dialogActions.close())}
                        />
                    </Dialog.Title>
                    <Dialog.Description className="flex flex-col justify-start items-center py-8 text-lg gap-12">
                        <p>You succesfully added/edited your rating!</p>
                        <Button
                            text="Sounds good!"
                            style="dark"
                            handleClick={() => dispatch(dialogActions.close())}
                        />
                    </Dialog.Description>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};
