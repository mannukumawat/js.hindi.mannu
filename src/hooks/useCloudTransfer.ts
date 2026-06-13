import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
    setRoomId,
    setTransferStatus,
    setFiles,
    setError,
    setIsSender,
    FileMeta,
    setMetrics,
} from '@/store/transferSlice';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const useCloudTransfer = () => {
    const dispatch = useDispatch();
    const transferState = useSelector((state: RootState) => state.transfer);

    // Upload files to cloud using presigned URLs
    const uploadToCloud = useCallback(async (files: File[]) => {
        try {
            dispatch(setIsSender(true));
            dispatch(setTransferStatus('uploading'));

            const fileMeta: FileMeta[] = [];
            let roomId = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Step 1: Get presigned URL from our API
                const urlResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                    }),
                });

                if (!urlResponse.ok) {
                    throw new Error('Failed to get upload URL');
                }

                const { roomId: newRoomId, uploadUrl, key } = await urlResponse.json();

                // Use first file's roomId
                if (i === 0) {
                    roomId = newRoomId;
                    dispatch(setRoomId(roomId));
                }

                // Step 2: Upload file directly to R2 using presigned URL
                const uploadResponse = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload file to storage');
                }

                fileMeta.push({
                    id: key,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    progress: 100,
                });

                // Update progress
                dispatch(setMetrics({
                    speed: 0,
                    eta: 0,
                    totalProgress: Math.round(((i + 1) / files.length) * 100),
                }));
            }

            dispatch(setFiles(fileMeta));
            dispatch(setTransferStatus('completed'));
            toast.success('Files uploaded to cloud!');

            return roomId;
        } catch (err) {
            console.error(err);
            dispatch(setError('Failed to upload files'));
            dispatch(setTransferStatus('error'));
            toast.error('Upload failed');
            return null;
        }
    }, [dispatch]);

    // Download files from cloud
    const downloadFromCloud = useCallback(async (roomId: string) => {
        try {
            dispatch(setIsSender(false));
            dispatch(setTransferStatus('downloading'));

            const response = await fetch(`/api/download/${roomId}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Room not found or expired');
                }
                throw new Error('Download failed');
            }

            const data = await response.json();

            const fileMeta: FileMeta[] = data.files.map((f: any) => ({
                id: f.key,
                name: f.fileName,
                size: f.size,
                type: 'application/octet-stream',
                progress: 100,
                downloadUrl: f.downloadUrl,
            }));

            dispatch(setFiles(fileMeta));
            dispatch(setRoomId(roomId));
            dispatch(setTransferStatus('completed'));

            return fileMeta;
        } catch (err: any) {
            console.error(err);
            dispatch(setError(err.message || 'Failed to get files'));
            dispatch(setTransferStatus('error'));
            toast.error(err.message || 'Download failed');
            return null;
        }
    }, [dispatch]);

    return {
        ...transferState,
        uploadToCloud,
        downloadFromCloud,
    };
};
