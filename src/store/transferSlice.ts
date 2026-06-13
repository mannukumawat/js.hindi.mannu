import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TransferStatus = 'idle' | 'uploading' | 'downloading' | 'completed' | 'cancelled' | 'error';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';
export type TransferMode = 'cloud' | 'p2p';

export interface FileMeta {
    id: string;
    name: string;
    size: number;
    type: string;
    progress: number; // 0 to 100
    downloadUrl?: string; // For cloud mode
}

interface TransferState {
    roomId: string | null;
    connectionStatus: ConnectionStatus;
    transferStatus: TransferStatus;
    transferMode: TransferMode;
    files: FileMeta[];
    totalProgress: number;
    speed: number; // bytes per second
    eta: number; // seconds
    error: string | null;
    isSender: boolean;
    receiverReady: boolean;
}

const initialState: TransferState = {
    roomId: null,
    connectionStatus: 'disconnected',
    transferStatus: 'idle',
    transferMode: 'cloud', // Default to cloud for reliability
    files: [],
    totalProgress: 0,
    speed: 0,
    eta: 0,
    error: null,
    isSender: false,
    receiverReady: false,
};

const transferSlice = createSlice({
    name: 'transfer',
    initialState,
    reducers: {
        setRoomId(state, action: PayloadAction<string>) {
            state.roomId = action.payload;
        },
        setConnectionStatus(state, action: PayloadAction<ConnectionStatus>) {
            state.connectionStatus = action.payload;
        },
        setTransferStatus(state, action: PayloadAction<TransferStatus>) {
            state.transferStatus = action.payload;
        },
        setFiles(state, action: PayloadAction<FileMeta[]>) {
            state.files = action.payload;
        },
        updateFileProgress(state, action: PayloadAction<{ id: string; progress: number }>) {
            const file = state.files.find((f) => f.id === action.payload.id);
            if (file) {
                file.progress = action.payload.progress;
            }
        },
        setMetrics(state, action: PayloadAction<{ speed: number; eta: number; totalProgress: number }>) {
            state.speed = action.payload.speed;
            state.eta = action.payload.eta;
            state.totalProgress = action.payload.totalProgress;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        setIsSender(state, action: PayloadAction<boolean>) {
            state.isSender = action.payload;
        },
        setReceiverReady(state, action: PayloadAction<boolean>) {
            state.receiverReady = action.payload;
        },
        setTransferMode(state, action: PayloadAction<TransferMode>) {
            state.transferMode = action.payload;
        },
        resetTransfer(state) {
            state.transferStatus = 'idle';
            state.files = [];
            state.totalProgress = 0;
            state.speed = 0;
            state.eta = 0;
            state.error = null;
            state.receiverReady = false;
        },
    },
});

export const {
    setRoomId,
    setConnectionStatus,
    setTransferStatus,
    setTransferMode,
    setFiles,
    updateFileProgress,
    setMetrics,
    setError,
    setIsSender,
    setReceiverReady,
    resetTransfer,
} = transferSlice.actions;

export default transferSlice.reducer;
