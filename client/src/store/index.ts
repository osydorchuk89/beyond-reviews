import { createSlice, configureStore } from "@reduxjs/toolkit";

const friendEventSlice = createSlice({
    name: "friendEvent",
    initialState: "none",
    reducers: {
        triggerFriendEvent: (_, action) => {
            return action.payload;
        },
    },
});

const messageEventSlice = createSlice({
    name: "messageEvent",
    initialState: "none",
    reducers: {
        triggerMessageEvent: (_, action) => {
            return action.payload;
        },
    },
});

export const store = configureStore({
    reducer: {
        friendEvent: friendEventSlice.reducer,
        messageEvent: messageEventSlice.reducer,
    },
});

export const { triggerFriendEvent } = friendEventSlice.actions;
export const { triggerMessageEvent } = messageEventSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
