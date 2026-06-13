import { DataConnection } from 'peerjs';

export const CHUNK_SIZE = 64 * 1024; // 64KB

export interface FileChunk {
    fileId: string;
    chunkIndex: number;
    totalChunks: number;
    data: ArrayBuffer;
}

export interface TransferProgress {
    fileName: string;
    progress: number;
    speed: number; // MB/s
    eta: number; // seconds
}

// Helper to calculate speed and ETA
// Speed aur ETA calculate karne ke liye helper
export const calculateMetrics = (
    startTime: number,
    bytesTransferred: number,
    totalBytes: number
) => {
    const currentTime = Date.now();
    const timeElapsed = (currentTime - startTime) / 1000; // seconds
    const speedBytesPerSec = bytesTransferred / timeElapsed;
    const speedMBps = speedBytesPerSec / (1024 * 1024);
    const remainingBytes = totalBytes - bytesTransferred;
    const eta = speedBytesPerSec > 0 ? remainingBytes / speedBytesPerSec : 0;

    return {
        speed: parseFloat(speedMBps.toFixed(2)), // MB/s
        eta: Math.ceil(eta), // seconds
    };
};

// Send file in chunks
// File ko chunks mein bhejta hai
export const sendFile = async (
    file: File,
    fileId: string,
    connection: DataConnection,
    onProgress: (bytesSent: number) => void
) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let chunkIndex = 0;
    let offset = 0;

    // Loop through chunks
    while (offset < file.size) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const arrayBuffer = await chunk.arrayBuffer();

        // Handle backpressure
        // Agar buffer full hai toh wait karo
        if ((connection as any).bufferedAmount > CHUNK_SIZE * 5) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        connection.send({
            type: 'FILE_CHUNK',
            fileId,
            chunkIndex,
            totalChunks,
            data: arrayBuffer,
        });

        offset += CHUNK_SIZE;
        chunkIndex++;
        onProgress(offset);
    }

    // Send completion message
    connection.send({
        type: 'FILE_END',
        fileId,
    });
};
