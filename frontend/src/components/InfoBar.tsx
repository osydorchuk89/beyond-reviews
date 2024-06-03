import { CloseIcon } from "./icons/CloseIcon";
import { useAppDispatch } from "../store/hooks";
import { infoBarActions } from "../store";

export const InfoBar = () => {
    const dispatch = useAppDispatch();

    return (
        <div className="flex justify-center items-center w-full py-1 font-medium bg-green-400">
            <p>You succesfully logged in!</p>
            <CloseIcon
                handleClick={() => dispatch(infoBarActions.hideLoggedInBar())}
                className="w-5 h-5 cursor-pointer absolute right-5"
            />
        </div>
    );
};
