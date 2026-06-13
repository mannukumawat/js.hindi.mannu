'use client';

import React, { useEffect, useState } from 'react';
import { useTransfer } from '@/hooks/useTransfer';
import { useCloudTransfer } from '@/hooks/useCloudTransfer';
import { FileList } from '@/components/FileList';
import { TransferProgress } from '@/components/TransferProgress';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Pizza, Download, Cloud, Users, ExternalLink } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FileMeta } from '@/store/transferSlice';

export default function ReceiverPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const roomId = params.roomId as string;
    const mode = searchParams.get('mode') || 'p2p';

    const [isCloudMode] = useState(mode === 'cloud');

    // P2P hooks
    const {
        connectionStatus,
        transferStatus: p2pTransferStatus,
        files: p2pFiles,
        totalProgress: p2pProgress,
        speed,
        eta,
        initializeReceiver,
        isSender
    } = useTransfer();

    // Cloud hooks
    const {
        transferStatus: cloudTransferStatus,
        files: cloudFiles,
        downloadFromCloud,
    } = useCloudTransfer();

    // Get active values based on mode
    const transferStatus = isCloudMode ? cloudTransferStatus : p2pTransferStatus;
    const files = isCloudMode ? cloudFiles : p2pFiles;
    const totalProgress = isCloudMode ? 100 : p2pProgress;

    // Initialize based on mode
    useEffect(() => {
        if (roomId) {
            if (isCloudMode) {
                downloadFromCloud(roomId);
            } else {
                initializeReceiver(roomId);
            }
        }
    }, [roomId, isCloudMode, downloadFromCloud, initializeReceiver]);

    // Handle download for cloud mode
    const handleDownload = (file: FileMeta) => {
        if (file.downloadUrl) {
            window.open(file.downloadUrl, '_blank');
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-background">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-8">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <Pizza className="w-6 h-6" />
                    PeerPizza
                </Link>
                {isCloudMode ? (
                    <div className="flex items-center gap-2 text-sm text-blue-500">
                        <Cloud className="w-4 h-4" />
                        <span>Cloud Transfer</span>
                    </div>
                ) : (
                    <ConnectionStatus status={connectionStatus} />
                )}
            </div>

            <div className="flex flex-col items-center w-full gap-8 max-w-xl">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">
                        {isCloudMode ? 'Download Files' : 'Receiving Files'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isCloudMode
                            ? transferStatus === 'completed'
                                ? 'Files ready for download!'
                                : 'Loading files...'
                            : connectionStatus === 'connected'
                                ? 'Connected to sender. Waiting for transfer...'
                                : 'Connecting to peer...'}
                    </p>
                </div>

                {/* Mode indicator */}
                <div className={`p-3 rounded-lg flex items-center gap-2 ${isCloudMode ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                    {isCloudMode ? <Cloud className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    <span className="text-sm font-medium">
                        {isCloudMode ? 'Cloud Transfer' : 'Peer-to-Peer Transfer'}
                    </span>
                </div>

                {/* Loading state */}
                {transferStatus === 'downloading' && files.length === 0 && (
                    <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading files...</p>
                    </div>
                )}

                {/* Error state */}
                {transferStatus === 'error' && (
                    <div className="p-4 rounded-lg bg-red-500/10 text-red-500 text-center">
                        <p>Failed to load files. The link may have expired.</p>
                        <Link href="/" className="text-sm underline mt-2 inline-block">
                            Go back home
                        </Link>
                    </div>
                )}

                {/* File list */}
                {files.length > 0 && (
                    <div className="w-full space-y-6 animate-in fade-in">
                        {isCloudMode ? (
                            // Cloud mode: Show download buttons
                            <div className="space-y-3">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 border rounded-lg bg-card"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{file.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(file)}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Download</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // P2P mode: Show transfer progress
                            <>
                                <FileList files={files} />
                                <TransferProgress
                                    totalProgress={totalProgress}
                                    speed={speed}
                                    eta={eta}
                                    isSender={isSender}
                                    status={transferStatus}
                                />
                            </>
                        )}
                    </div>
                )}

                {transferStatus === 'completed' && (
                    <div className="p-4 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <span>
                            {isCloudMode
                                ? 'Files ready! Click download to save.'
                                : 'Transfer Completed! Files downloaded.'}
                        </span>
                    </div>
                )}
            </div>
        </main>
    );
}
