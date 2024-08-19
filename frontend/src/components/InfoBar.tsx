import { CloseIcon } from "./icons/CloseIcon";
import { useAppDispatch } from "../store/hooks";
import { infoBarActions } from "../store";
import { useEffect } from "react";
import { motion } from "framer-motion";

interface ValuesElementsType {
    text: string;
    closeFunction: () => void;
}

interface ValuesType {
    justLoggedIn: ValuesElementsType;
    justLoggedOut: ValuesElementsType;
    justRegistered: ValuesElementsType;
    addedToWatchLater: ValuesElementsType;
    removedFromWatchLater: ValuesElementsType;
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
        addedToWatchLater: {
            text: "You added the movie to your watchlist",
            closeFunction: () =>
                dispatch(infoBarActions.hideAddedToWatchListBar()),
        },
        removedFromWatchLater: {
            text: "You removed the movie from your watchlist",
            closeFunction: () =>
                dispatch(infoBarActions.hideRemovedFromoWatchListBar()),
        },
    };
    const dispatch = useAppDispatch();

    const infoBarText = values[action as keyof ValuesType].text;
    const infoBarFunction = values[action as keyof ValuesType].closeFunction;

    useEffect(() => {
        setTimeout(infoBarFunction, 2000);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center w-full py-1 font-medium bg-green-400 absolute"
        >
            <p>{infoBarText}</p>
            <CloseIcon
                handleClick={infoBarFunction}
                className="w-5 h-5 cursor-pointer absolute right-5"
            />
        </motion.div>
    );
};
