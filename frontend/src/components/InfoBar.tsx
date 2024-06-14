import { CloseIcon } from "./icons/CloseIcon";
import { useAppDispatch } from "../store/hooks";
import { infoBarActions } from "../store";
import { useEffect } from "react";

interface ValuesElementsType {
    text: string;
    closeFunction: () => void;
}

interface ValuesType {
    justLoggedIn: ValuesElementsType;
    justLoggedOut: ValuesElementsType;
    justRegistered: ValuesElementsType;
}

export const InfoBar = ({ action }: { action: string }) => {
    const values: ValuesType = {
        justLoggedIn: {
            text: "You successfully logged in",
            closeFunction: () => dispatch(infoBarActions.hideLoggedInBar()),
        },
        justLoggedOut: {
            text: "You logged out",
            closeFunction: () => dispatch(infoBarActions.hideLoggedOutBar()),
        },
        justRegistered: {
            text: "You successfully registered",
            closeFunction: () => dispatch(infoBarActions.hideRegisteredBar()),
        },
    };
    const dispatch = useAppDispatch();

    const infoBarText = values[action as keyof ValuesType].text;
    const infoBarFunction = values[action as keyof ValuesType].closeFunction;

    useEffect(() => {
        setTimeout(infoBarFunction, 3000);
    }, []);

    return (
        <div className="flex justify-center items-center w-full py-1 font-medium bg-green-400 animate-fade absolute">
            <p>{infoBarText}</p>
            <CloseIcon
                handleClick={infoBarFunction}
                className="w-5 h-5 cursor-pointer absolute right-5"
            />
        </div>
    );
};
