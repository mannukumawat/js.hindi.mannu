import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
    setRoomId,
    setConnectionStatus,
    setTransferStatus,
    setFiles,
    updateFileProgress,
    setMetrics,
    setError,
    setIsSender,
    setReceiverReady,
    resetTransfer,
    FileMeta,
} from '@/store/transferSlice';
import { peerService } from '@/lib/peer';
import { sendFile, calculateMetrics, CHUNK_SIZE } from '@/lib/chunkTransfer';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const useTransfer = () => {
    const dispatch = useDispatch();
    const transferState = useSelector((state: RootState) => state.transfer);
    const filesRef = React.useRef(transferState.files);

    useEffect(() => {
        filesRef.current = transferState.files;
    }, [transferState.files]);

    // Initialize Peer as Sender
    // Sender ke liye Peer initialize karo
    const initializeSender = useCallback(async () => {
        try {
            const id = uuidv4();
            await peerService.init(id);
            dispatch(setRoomId(id));
            dispatch(setIsSender(true));
            dispatch(setConnectionStatus('disconnected'));
            dispatch(setReceiverReady(false));

            peerService.onConnection((conn) => {
                dispatch(setConnectionStatus('connected'));
                toast.success('Peer connected!');

                // Listen for data from receiver
                conn.on('data', (data: any) => {
                    if (data.type === 'RECEIVER_READY') {
                        dispatch(setReceiverReady(true));
                        console.log('Receiver is ready to receive files');
                    }
                });

                conn.on('close', () => {
                    dispatch(setConnectionStatus('disconnected'));
                    dispatch(setReceiverReady(false));
                    toast.error('Peer disconnected');
                });
            });
        } catch (err) {
            console.error(err);
            dispatch(setError('Failed to initialize peer'));
        }
    }, [dispatch]);

    // Initialize Peer as Receiver
    // Receiver ke liye Peer initialize karo
    const initializeReceiver = useCallback(async (roomId: string) => {
        try {
            await peerService.init(); // Auto-generate ID for receiver
            dispatch(setRoomId(roomId));
            dispatch(setIsSender(false));
            dispatch(setConnectionStatus('connecting'));

            const conn = await peerService.connect(roomId);

            // Connection is already open when promise resolves
            dispatch(setConnectionStatus('connected'));
            toast.success('Connected to sender!');

            // Set up data listener first
            conn.on('data', (data: any) => {
                if (data.type === 'FILE_META') {
                    dispatch(setFiles(data.files));
                    dispatch(setTransferStatus('downloading'));
                } else if (data.type === 'FILE_CHUNK') {
                    // Handle file chunk (This logic needs to be robust for multiple files)
                    // For simplicity in this hook, we might delegate to a specialized handler or keep it here
                    // Real implementation needs to reassemble chunks
                    handleIncomingChunk(data, dispatch);
                } else if (data.type === 'FILE_END') {
                    // Handle file completion
                    // File complete hone par download trigger karo
                    handleFileCompletion(data.fileId, filesRef.current);
                }
            });

            conn.on('close', () => {
                dispatch(setConnectionStatus('disconnected'));
                toast.error('Disconnected from sender');
            });

            // Send RECEIVER_READY signal to sender AFTER setting up data listener
            conn.send({ type: 'RECEIVER_READY' });
            console.log('Sent RECEIVER_READY signal to sender');

        } catch (err) {
            console.error(err);
            dispatch(setError('Failed to connect to peer'));
            dispatch(setConnectionStatus('failed'));
        }
    }, [dispatch]);

    // Send Files
    // Files bhejo
    const sendFiles = useCallback(async (files: File[]) => {
        const conn = peerService.getConnection();
        if (!conn) {
            toast.error('No peer connected');
            return;
        }

        const fileMeta: FileMeta[] = files.map(f => ({
            id: uuidv4(),
            name: f.name,
            size: f.size,
            type: f.type,
            progress: 0
        }));

        dispatch(setFiles(fileMeta));
        dispatch(setTransferStatus('uploading'));

        // Send Metadata first
        conn.send({
            type: 'FILE_META',
            files: fileMeta
        });

        let totalBytesSent = 0;
        const totalSize = files.reduce((acc, f) => acc + f.size, 0);
        const startTime = Date.now();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const meta = fileMeta[i];

            await sendFile(file, meta.id, conn, (bytesSent) => {
                const fileProgress = Math.min(100, Math.round((bytesSent / file.size) * 100));
                dispatch(updateFileProgress({ id: meta.id, progress: fileProgress }));

                totalBytesSent += CHUNK_SIZE; // Approximation or track actual
                // Better: track total bytes sent across all files
                // For now, simple progress update

                const metrics = calculateMetrics(startTime, totalBytesSent, totalSize);
                dispatch(setMetrics({ ...metrics, totalProgress: Math.round((totalBytesSent / totalSize) * 100) }));
            });
        }

        dispatch(setTransferStatus('completed'));
        toast.success('All files sent!');
    }, [dispatch]);

    return {
        ...transferState,
        initializeSender,
        initializeReceiver,
        sendFiles,
    };
};

// Helper to handle incoming chunks
// Incoming chunks ko handle karne ke liye helper
const receivedChunks: Record<string, ArrayBuffer[]> = {};
const receivedSizes: Record<string, number> = {};

const handleIncomingChunk = (data: any, dispatch: any) => {
    const { fileId, chunkIndex, totalChunks, data: chunkData } = data;

    if (!receivedChunks[fileId]) {
        receivedChunks[fileId] = new Array(totalChunks);
        receivedSizes[fileId] = 0;
    }

    receivedChunks[fileId][chunkIndex] = chunkData;
    receivedSizes[fileId] += (chunkData as ArrayBuffer).byteLength;

    // We can't easily calculate percentage here without file size from meta
    // But we can dispatch an event or just wait for completion
};

export const handleFileCompletion = (fileId: string, files: FileMeta[]) => {
    const chunks = receivedChunks[fileId];
    if (!chunks || chunks.some(c => !c)) {
        console.error('Missing chunks for file', fileId);
        return;
    }

    const fileMeta = files.find(f => f.id === fileId);
    if (!fileMeta) return;

    const blob = new Blob(chunks, { type: fileMeta.type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileMeta.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Cleanup
    delete receivedChunks[fileId];
    delete receivedSizes[fileId];
};
