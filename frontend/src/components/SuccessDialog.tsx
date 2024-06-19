import { useAppSelector, useAppDispatch } from "../store/hooks";
import { popUpActions } from "../store";
import { Dialog } from "@headlessui/react";
import { Button } from "./Button";
import { CloseIcon } from "./icons/CloseIcon";

export const SuccessDialog = () => {
    const {
        isOpen,
        submittedRating,
        sentFriendRequest,
        acceptedFriendRequest,
    } = useAppSelector((state) => state.popUp);
    const dispatch = useAppDispatch();

    return (
        <Dialog open={isOpen} onClose={() => dispatch(popUpActions.close())}>
            <div
                className="fixed inset-0 bg-black/75 z-20"
                aria-hidden="true"
            />
            <div className="fixed inset-0 flex w-screen items-center justify-center z-30">
                <Dialog.Panel className="rounded-xl bg-white w-[480px] shadow-md">
                    <Dialog.Title className="flex rounded-xl rounded-b-none bg-amber-500 py-5 relative justify-center shadow-md">
                        <span className="text-xl font-bold">Success</span>
                        <CloseIcon
                            handleClick={() => dispatch(popUpActions.close())}
                            className="w-6 h-6 cursor-pointer absolute right-5"
                        />
                    </Dialog.Title>
                    <Dialog.Description className="flex flex-col justify-start items-center py-8 text-lg gap-12">
                        {submittedRating && (
                            <p>You succesfully added/edited your rating!</p>
                        )}
                        {sentFriendRequest && (
                            <p>You succesfully sent a friend request!</p>
                        )}
                        {acceptedFriendRequest && (
                            <p>You succesfully accepted a friend request!</p>
                        )}
                        <Button
                            text="Sounds good"
                            style="dark"
                            handleClick={() => dispatch(popUpActions.close())}
                        />
                    </Dialog.Description>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};
