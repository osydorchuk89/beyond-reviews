import { createSlice, configureStore } from "@reduxjs/toolkit";

const authEventSlice = createSlice({
    name: "authEvent",
    initialState: "none",
    reducers: {
        triggerAuthEvent: (_, action) => {
            return action.payload;
        },
    },
});

const reviewEventSlice = createSlice({
    name: "reviewEvent",
    initialState: "none",
    reducers: {
        triggerReviewEvent: (_, action) => {
            return action.payload;
        },
    },
});

export const store = configureStore({
    reducer: {
        authEvent: authEventSlice.reducer,
        reviewEvent: reviewEventSlice.reducer,
    },
});

export const { triggerAuthEvent } = authEventSlice.actions;
export const { triggerReviewEvent } = reviewEventSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
