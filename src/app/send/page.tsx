'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useTransfer } from '@/hooks/useTransfer';
import { useCloudTransfer } from '@/hooks/useCloudTransfer';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { TransferProgress } from '@/components/TransferProgress';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { QRCodeModal } from '@/components/QRCodeModal';
import { ModeSelector } from '@/components/ModeSelector';
import { Pizza, ArrowLeft, Cloud, Users } from 'lucide-react';
import { toast } from 'sonner';

// 6GB limit for Relay mode (in bytes)
const MAX_RELAY_FILE_SIZE = 6 * 1024 * 1024 * 1024; // 6GB

export default function SendPage() {
  const transferMode = useSelector((state: RootState) => state.transfer.transferMode);

  // P2P hooks
  const {
    roomId: p2pRoomId,
    connectionStatus,
    transferStatus: p2pTransferStatus,
    files: p2pFiles,
    totalProgress: p2pProgress,
    speed: p2pSpeed,
    eta: p2pEta,
    initializeSender,
    sendFiles,
    isSender,
    receiverReady
  } = useTransfer();

  // Cloud hooks
  const {
    roomId: cloudRoomId,
    transferStatus: cloudTransferStatus,
    files: cloudFiles,
    totalProgress: cloudProgress,
    uploadToCloud,
  } = useCloudTransfer();

  const [localFiles, setLocalFiles] = React.useState<File[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  // Get active values based on mode
  const roomId = transferMode === 'cloud' ? cloudRoomId : p2pRoomId;
  const transferStatus = transferMode === 'cloud' ? cloudTransferStatus : p2pTransferStatus;
  const files = transferMode === 'cloud' ? cloudFiles : p2pFiles;
  const totalProgress = transferMode === 'cloud' ? cloudProgress : p2pProgress;
  const speed = transferMode === 'cloud' ? 0 : p2pSpeed;
  const eta = transferMode === 'cloud' ? 0 : p2pEta;

  // Handle file selection
  const handleFilesSelected = async (selectedFiles: File[]) => {
    // Check file size limit for Relay mode
    if (transferMode === 'cloud') {
      const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);
      const oversizedFile = selectedFiles.find(file => file.size > MAX_RELAY_FILE_SIZE);

      if (oversizedFile || totalSize > MAX_RELAY_FILE_SIZE) {
        toast.error('Server Maintenance', {
          description: 'Files above 6GB cannot be uploaded via Relay mode temporarily. Please use P2P mode for large files, or try again later.',
          duration: 6000,
        });
        return;
      }
    }

    setLocalFiles(selectedFiles);

    if (transferMode === 'cloud') {
      // Cloud mode: upload immediately
      setIsUploading(true);
      await uploadToCloud(selectedFiles);
      setIsUploading(false);
    } else {
      // P2P mode: initialize sender and wait for receiver
      if (connectionStatus === 'disconnected' || !p2pRoomId) {
        initializeSender();
      }
    }
  };

  // P2P: Initialize when files selected
  useEffect(() => {
    if (transferMode === 'p2p' && localFiles.length > 0 && !p2pRoomId) {
      initializeSender();
    }
  }, [transferMode, localFiles, p2pRoomId, initializeSender]);

  // P2P: Wait for receiverReady signal before sending files
  useEffect(() => {
    if (transferMode === 'p2p' && receiverReady && localFiles.length > 0 && p2pTransferStatus === 'idle') {
      sendFiles(localFiles);
    }
  }, [transferMode, receiverReady, localFiles, p2pTransferStatus, sendFiles]);

  const shareLink = roomId ? `${window.location.origin}/share/${roomId}${transferMode === 'cloud' ? '?mode=cloud' : ''}` : '';

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Backgound Grid Pattern */}
      <div className="fixed inset-0 z-0 h-full w-full bg-black bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-violet-500/10 via-transparent to-orange-500/10 blur-3xl"></div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
            <div className="p-1.5 rounded-lg bg-white/10">
              <Pizza className="w-5 h-5 text-orange-500" />
            </div>
            <span>PeerPizza</span>
          </Link>
          <div className="flex items-center gap-4">
            {transferMode === 'cloud' ? (
              <div className="flex items-center gap-2 text-sm text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Cloud className="w-4 h-4" />
                <span>Cloud Mode</span>
              </div>
            ) : (
              <ConnectionStatus status={connectionStatus} roomId={p2pRoomId} />
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="flex flex-col items-center gap-8">
            {!roomId && localFiles.length === 0 && (
              <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent">
                  Send Files
                </h1>
                <p className="text-xl text-zinc-400">
                  Choose your transfer mode and drop files to start sharing
                </p>
              </div>
            )}

            {/* Mode Selector - only show before upload starts */}
            {localFiles.length === 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 w-full">
                <ModeSelector />
              </div>
            )}

            {localFiles.length === 0 ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 w-full">
                <DropZone onFilesSelected={handleFilesSelected} />
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* Mode indicator */}
                <div className={`p-3 rounded-xl flex items-center gap-2 justify-center border ${transferMode === 'cloud'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
                  }`}>
                  {transferMode === 'cloud' ? <Cloud className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {transferMode === 'cloud' ? 'Cloud Transfer' : 'Peer-to-Peer Transfer'}
                  </span>
                </div>

                {roomId && (
                  <div className="p-6 border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm space-y-4">
                    <h3 className="font-semibold text-white">Share this link</h3>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-3 bg-black/50 border border-white/10 rounded-lg text-sm text-zinc-300 truncate font-mono">
                        {shareLink}
                      </code>
                      <QRCodeModal link={shareLink} />
                    </div>
                    <p className="text-xs text-zinc-500 text-center">
                      {transferMode === 'cloud'
                        ? 'Link valid for 1 hour. Receiver can download anytime.'
                        : 'Keep this page open while transferring.'}
                    </p>
                  </div>
                )}

                {/* Waiting for receiver (P2P only) */}
                {transferMode === 'p2p' && roomId && connectionStatus !== 'connected' && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-center animate-pulse">
                    <p className="text-sm font-medium">Waiting for receiver to connect...</p>
                  </div>
                )}

                <FileList files={files.length > 0 ? files : localFiles.map(f => ({ id: f.name, name: f.name, size: f.size, type: f.type, progress: 0 }))} />

                <TransferProgress
                  totalProgress={totalProgress}
                  speed={speed}
                  eta={eta}
                  isSender={isSender}
                  status={isUploading ? 'uploading' : transferStatus}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
