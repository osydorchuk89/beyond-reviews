import { createSlice, configureStore } from "@reduxjs/toolkit";

interface MessageBoxState {
    isOpen: boolean;
    allUsers: boolean | null;
    otherUser: { id: string; name: string } | null;
}

interface PopUpState {
    isOpen: boolean;
    submittedRating: boolean;
    sentFriendRequest: boolean;
    acceptedFriendRequest: boolean;
}

interface InfoBarState {
    justRegistered: boolean;
    justLoggedIn: boolean;
    justLoggedOut: boolean;
    addedToWatchList: boolean;
    removedFromWatchList: boolean;
}

interface DropDownMenuState {
    isOpen: boolean;
}

const initialMessageBoxState: MessageBoxState = {
    isOpen: false,
    allUsers: true,
    otherUser: null,
};
const initialPopUpState: PopUpState = {
    isOpen: false,
    submittedRating: false,
    sentFriendRequest: false,
    acceptedFriendRequest: false,
};
const initialInfoBarState: InfoBarState = {
    justRegistered: false,
    justLoggedIn: false,
    justLoggedOut: false,
    addedToWatchList: false,
    removedFromWatchList: false,
};
const initialDropDownMenuState: DropDownMenuState = {
    isOpen: false,
};

const messageBoxSlice = createSlice({
    name: "messageBox",
    initialState: initialMessageBoxState,
    reducers: {
        open(state) {
            state.isOpen = true;
            state.allUsers = true;
        },
        close(state) {
            state.isOpen = false;
            state.allUsers = null;
        },
        selectSingleUser(state, action) {
            state.allUsers = false;
            state.otherUser = action.payload;
        },
        selectAllUSers(state) {
            state.allUsers = true;
            state.otherUser = null;
        },
    },
});

const popUpSlice = createSlice({
    name: "popUp",
    initialState: initialPopUpState,
    reducers: {
        openSubmittedRatingPopUp(state) {
            state.isOpen = true;
            state.submittedRating = true;
        },
        openSentFriendRequestPopUp(state) {
            state.isOpen = true;
            state.sentFriendRequest = true;
        },
        openAcceptedFriendRequestPopUp(state) {
            state.isOpen = true;
            state.acceptedFriendRequest = true;
        },
        close(state) {
            state.isOpen = false;
            state.submittedRating = false;
            state.sentFriendRequest = false;
        },
    },
});

const infoBarSlice = createSlice({
    name: "infoBar",
    initialState: initialInfoBarState,
    reducers: {
        showRegisteredBar(state) {
            state.justRegistered = true;
        },
        hideRegisteredBar(state) {
            state.justRegistered = false;
        },
        showLoggedInBar(state) {
            state.justLoggedIn = true;
        },
        hideLoggedInBar(state) {
            state.justLoggedIn = false;
        },
        showLoggedOutBar(state) {
            state.justLoggedOut = true;
        },
        hideLoggedOutBar(state) {
            state.justLoggedOut = false;
        },
        showAddedToWatchListBar(state) {
            state.addedToWatchList = true;
        },
        hideAddedToWatchListBar(state) {
            state.addedToWatchList = false;
        },
        showRemovedFromoWatchListBar(state) {
            state.removedFromWatchList = true;
        },
        hideRemovedFromoWatchListBar(state) {
            state.removedFromWatchList = false;
        },
    },
});

const dropDownMenuSlice = createSlice({
    name: "dropDownMenu",
    initialState: initialDropDownMenuState,
    reducers: {
        openDropDownMenu(state) {
            state.isOpen = true;
        },
        closeDropDownMenu(state) {
            state.isOpen = false;
        },
    },
});

export const store = configureStore({
    reducer: {
        messageBox: messageBoxSlice.reducer,
        popUp: popUpSlice.reducer,
        infoBar: infoBarSlice.reducer,
        dropDownMenu: dropDownMenuSlice.reducer,
    },
});
export const messageBoxActions = messageBoxSlice.actions;
export const popUpActions = popUpSlice.actions;
export const infoBarActions = infoBarSlice.actions;
export const dropDownMenuActions = dropDownMenuSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
