'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pizza, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { databases, APPWRITE_DATABASE_ID, COLLECTIONS, ID } from '@/lib/appwrite'

// Hooks
import { useRoom } from '@/hooks/useRoom'
import { useAuth } from '@/hooks/useAuth'
import { useChat } from '@/hooks/useChat'
import { useAppwriteFiles } from '@/hooks/useAppwriteFiles'
import { usePresence } from '@/hooks/usePresence'
import { useCloudTransfer } from '@/hooks/useCloudTransfer'

// Components
import { ChatRoom } from '@/components/ChatRoom'
import { RoomHeader } from '@/components/RoomHeader'
import { AuthModal } from '@/components/AuthModal'
import { VideoCallManager } from '@/components/VideoCallManager'
import { useVideoCall } from '@/hooks/useVideoCall'

type FileMode = 'p2p' | 'relay' | 'quick'

const MAX_RELAY_SIZE = 6 * 1024 * 1024 * 1024 // 6GB
const MAX_QUICK_SIZE = 50_000_000 // 50MB — Appwrite Cloud per-file cap on this plan

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  // Auth & Room state
  const { user, signIn, signUp, signInAsGuest, resetPassword, isAuthenticated } = useAuth()
  const { room, joinRoom, makePermanent, loading: roomLoading, error: roomError } = useRoom()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [guestName, setGuestName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('peer_pizza_guest_name') || `Guest-${Math.random().toString(36).slice(2, 6)}`
    }
    return `Guest-${Math.random().toString(36).slice(2, 6)}`
  })

  // Update localStorage when name changes
  const handleUpdateGuestName = (name: string) => {
    setGuestName(name)
    localStorage.setItem('peer_pizza_guest_name', name)
  }

  // Chat
  const { messages, sendMessage } = useChat(room?.id || null)

  // Appwrite Files (Quick share)
  const {
    files: quickFiles,
    uploading: quickUploading,
    uploadFile: uploadQuickFile,
    downloadFile,
    fetchFiles,
  } = useAppwriteFiles(room?.id || null)

  // Cloud/Relay Transfer
  const {
    uploadToCloud,
    transferStatus: relayStatus,
  } = useCloudTransfer()

  // Presence
  const { onlineUsers, typingUsers, systemEvents, setTyping, myPresenceId } = usePresence(room?.id || null, guestName)

  // Video calling
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(false)
  const {
    callState,
    callType,
    remoteUserName,
    localStream,
    remoteStream,
    isMicMuted,
    isCamOff,
    startCall,
    answerCall,
    declineCall,
    toggleMute,
    toggleCamera,
  } = useVideoCall({
    myPresenceId,
    onlineUsers,
  })

  const showCallManager = isCallPanelOpen || callState !== 'idle'

  // Join room on mount
  useEffect(() => {
    if (resolvedParams.roomId) {
      joinRoom(resolvedParams.roomId)
    }
  }, [resolvedParams.roomId, joinRoom])

  // Fetch files when room loads
  useEffect(() => {
    if (room?.id) {
      fetchFiles()
    }
  }, [room?.id, fetchFiles])

  // Handle file upload
  const handleUploadFiles = async (selectedFiles: File[], mode: FileMode) => {
    const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0)

    if (mode === 'quick') {
      if (totalSize > MAX_QUICK_SIZE) {
        toast.error('Files exceed 50MB limit. Use Relay or P2P for larger files.')
        return
      }
      let successCount = 0
      for (const file of selectedFiles) {
        const res = await uploadQuickFile(file, user?.id, guestName)
        if (res) {
          successCount++
        }
      }
      if (successCount === selectedFiles.length) {
        toast.success('Files uploaded!')
      } else if (successCount > 0) {
        toast.warning(`Uploaded ${successCount} of ${selectedFiles.length} files.`)
      } else {
        toast.error('Failed to upload files.')
      }
    } else if (mode === 'relay') {
      if (totalSize > MAX_RELAY_SIZE) {
        toast.error('Files exceed 6GB limit. Use P2P for unlimited transfer.')
        return
      }
      
      // Upload to R2 via Relay
      const relayRoomId = await uploadToCloud(selectedFiles)
      
      if (relayRoomId && room?.id) {
        // Save file metadata to room_files so it appears in chat
        for (const file of selectedFiles) {
          await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.roomFiles, ID.unique(), {
            room_id: room.id,
            file_name: file.name,
            file_size: file.size,
            storage_path: `relay:${relayRoomId}:${file.name}`, // Special path format for relay
            uploaded_by: user?.id || null,
            guest_name: guestName,
          } as any)
        }
      }
    } else {
      // P2P
      toast.info('P2P mode coming soon in unified chat!')
    }
  }

  // Handle make permanent
  const handleMakePermanent = async () => {
    if (!room || !user) return
    const result = await makePermanent(room.id, user.id)
    if (result) {
      toast.success('Room is now permanent!')
    }
  }

  // Handle chat send
  const handleSendMessage = (content: string) => {
    sendMessage(content, user?.id, guestName)
  }

  // Loading state
  if (roomLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  // Error state
  if (roomError || !room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Room Not Found</h1>
          <p className="text-zinc-400 mb-6">{roomError || 'This room does not exist or has expired.'}</p>
          <Link href="/">
            <Button className="bg-orange-600 hover:bg-orange-500">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Background */}
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
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Room Header */}
          <RoomHeader
            room={room}
            isAuthenticated={isAuthenticated}
            onMakePermanent={handleMakePermanent}
            onOpenAuth={() => setShowAuthModal(true)}
            guestName={guestName}
            onUpdateGuestName={handleUpdateGuestName}
            isCallPanelOpen={showCallManager}
            onToggleCallPanel={() => setIsCallPanelOpen(prev => !prev)}
          />

          {/* Unified Chat Room + Video Call Container */}
          <div className={`mt-6 ${showCallManager ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
            {showCallManager && (
              <VideoCallManager
                callState={callState}
                callType={callType}
                remoteUserName={remoteUserName}
                localStream={localStream}
                remoteStream={remoteStream}
                isMicMuted={isMicMuted}
                isCamOff={isCamOff}
                onlineUsers={onlineUsers}
                myPresenceId={myPresenceId}
                onStartCall={startCall}
                onAnswerCall={answerCall}
                onDeclineCall={declineCall}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onClosePanel={() => setIsCallPanelOpen(false)}
              />
            )}
            <ChatRoom
              messages={messages}
              onSendMessage={handleSendMessage}
              files={quickFiles}
              onUploadFiles={handleUploadFiles}
              onDownloadFile={downloadFile}
              uploading={quickUploading}
              onlineUsers={onlineUsers}
              typingUsers={typingUsers}
              systemEvents={systemEvents}
              onTyping={setTyping}
              currentUserId={user?.id}
              guestName={guestName}
            />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={signIn}
        onRegister={signUp}
        onForgotPassword={resetPassword}
        onGuest={signInAsGuest}
      />
    </main>
  )
}

