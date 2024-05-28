import { createSlice, configureStore } from "@reduxjs/toolkit";

interface MessageBoxState {
    isOpen: boolean;
    allUsers: boolean | null;
    otherUser: { id: string; name: string } | null;
}

interface PopUpState {
    isOpen: boolean;
}

const initialMessageBoxState: MessageBoxState = {
    isOpen: false,
    allUsers: true,
    otherUser: null,
};
const initialPopUpState: PopUpState = {
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
        open(state) {
            state.isOpen = true;
        },
        close(state) {
            state.isOpen = false;
        },
    },
});

export const store = configureStore({
    reducer: { messageBox: messageBoxSlice.reducer, popUp: popUpSlice.reducer },
});
export const messageBoxActions = messageBoxSlice.actions;
export const popUpActions = popUpSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
