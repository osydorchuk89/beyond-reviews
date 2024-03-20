import { createSlice, configureStore } from "@reduxjs/toolkit";

const initialAuthState = { isAuthenticated: false, userData: null };

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

export const store = configureStore({
    reducer: { auth: authSlice.reducer },
});
export const authActions = authSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
