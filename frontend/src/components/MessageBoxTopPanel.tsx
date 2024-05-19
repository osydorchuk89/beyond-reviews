import { BackIcon } from "./BackIcon";
import { Popover } from "@headlessui/react";
import { CloseIconAlt } from "./icons/CloseIconAlt";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { dialogActions } from "../store";

export const MessageBoxTopPanel = () => {
    const { allUsers } = useAppSelector((state) => state.dialog);
    const dispatch = useAppDispatch();

    return (
        <div className="flex justify-between py-3 px-3">
            {allUsers ? (
                <button className="invisible" />
            ) : (
                <button>
                    <BackIcon
                        className="w-8 h-8"
                        handleClick={() => {
                            dispatch(dialogActions.selectAllUSers());
                        }}
                    />
                </button>
            )}
            <Popover.Button>
                <CloseIconAlt className="w-8 h-8" />
            </Popover.Button>
        </div>
    );
};
