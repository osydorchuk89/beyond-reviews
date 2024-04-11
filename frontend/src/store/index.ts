import { createSlice, configureStore } from "@reduxjs/toolkit";

export interface AuthState {
    isAuthenticated: boolean;
    userData: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        password?: string;
        googleId?: string;
    } | null;
}

interface DialogState {
    isOpen: boolean;
}

const initialAuthState: AuthState = { isAuthenticated: false, userData: null };
const initialDialogState: DialogState = { isOpen: false };

const authSlice = createSlice({
    name: "auth",
    initialState: initialAuthState,
    reducers: {
        login(state, action) {
            state.isAuthenticated = true;
            state.userData = action.payload;
        },
        logout(state) {
            state.isAuthenticated = false;
            state.userData = null;
        },
    },
});

const dialogSlice = createSlice({
    name: "dialog",
    initialState: initialDialogState,
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
    reducer: { auth: authSlice.reducer, dialog: dialogSlice.reducer },
});
export const authActions = authSlice.actions;
export const dialogActions = dialogSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
