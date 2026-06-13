import { configureStore } from '@reduxjs/toolkit';
import transferReducer from './transferSlice';

export const store = configureStore({
    reducer: {
        transfer: transferReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
