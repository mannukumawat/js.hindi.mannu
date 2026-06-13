'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Message, RoomFile } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import { Send, Paperclip, Download, X, Users, Database, Cloud, Wifi, Loader2, FileIcon, Bell, BellOff, Eye } from 'lucide-react'
import { FilePreviewModal, isImageFile, isVideoFile, isAudioFile } from './FilePreviewModal'
import { storage, BUCKET_ID } from '@/lib/appwrite'

type FileMode = 'quick' | 'relay' | 'p2p'

interface SystemEvent {
  type: 'join' | 'leave'
  userName: string
  timestamp: string
}

interface ChatRoomProps {
  // Messages
  messages: Message[]
  onSendMessage: (content: string) => void
  
  // Files
  files: RoomFile[]
  onUploadFiles: (files: File[], mode: FileMode) => void
  onDownloadFile: (file: RoomFile) => void
  uploading?: boolean
  
  // Presence
  onlineUsers: { id: string; name: string; joinedAt: string }[]
  typingUsers: string[]
  systemEvents: SystemEvent[]
  onTyping: (isTyping: boolean) => void
  
  // User info
  currentUserId?: string
  guestName: string
  
  // Transfer state (for P2P/Relay progress)
  transferProgress?: number
  transferStatus?: string
}

export function ChatRoom({
  messages,
  onSendMessage,
  files,
  onUploadFiles,
  onDownloadFile,
  uploading,
  onlineUsers,
  typingUsers,
  systemEvents,
  onTyping,
  currentUserId,
  guestName,
  transferProgress,
  transferStatus,
}: ChatRoomProps) {
  const [input, setInput] = useState('')
  const [fileMode, setFileMode] = useState<FileMode>('quick')
  const [showFilePicker, setShowFilePicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File preview state
  const [previewFile, setPreviewFile] = useState<RoomFile | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Thumbnail URL cache
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({})

  // Get URL for file preview (Appwrite Storage view URL)
  const getSignedUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    if (storagePath.startsWith('relay:')) return null
    return storage.getFileView(BUCKET_ID, storagePath)
  }, [])

  // Load thumbnails for image files
  useEffect(() => {
    const loadThumbnails = async () => {
      const imageFiles = files.filter(f => 
        isImageFile(f.file_name) && 
        !f.storage_path.startsWith('relay:') &&
        !thumbnailUrls[f.id]
      )
      
      if (imageFiles.length === 0) return

      const newUrls: Record<string, string> = {}
      
      for (const file of imageFiles) {
        try {
          const url = await getSignedUrl(file.storage_path)
          if (url) newUrls[file.id] = url
        } catch (err) {
          console.error('Failed to load thumbnail:', err)
        }
      }
      
      if (Object.keys(newUrls).length > 0) {
        setThumbnailUrls(prev => ({ ...prev, ...newUrls }))
      }
    }

    loadThumbnails()
  }, [files, getSignedUrl, thumbnailUrls])

  // Open file preview
  const openPreview = (file: RoomFile) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  // Combine messages, files, and system events into a single feed
  const feedItems = React.useMemo(() => {
    const items: Array<{
      type: 'message' | 'file' | 'system'
      data: Message | RoomFile | SystemEvent
      timestamp: string
    }> = []

    messages.forEach(m => items.push({ type: 'message', data: m, timestamp: m.created_at }))
    files.forEach(f => items.push({ type: 'file', data: f, timestamp: f.created_at }))
    systemEvents.forEach(e => items.push({ type: 'system', data: e, timestamp: e.timestamp }))

    return items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [messages, files, systemEvents])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [feedItems])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
      onTyping(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    onTyping(e.target.value.length > 0)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      onUploadFiles(selectedFiles, fileMode)
      setShowFilePicker(false)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
    }
  }

  // Handle new messages notification
  useEffect(() => {
    if (feedItems.length === 0) return

    const lastItem = feedItems[feedItems.length - 1]
    
    // Only notify for new messages/files from others
    if (lastItem.type === 'system') return
    
    const isOwn = 
      (lastItem.type === 'message' && (lastItem.data as Message).user_id === currentUserId) ||
      (lastItem.type === 'file' && (lastItem.data as RoomFile).uploaded_by === currentUserId)
      
    if (isOwn) return

    // If document is hidden or user inactive -> Notify
    if (document.hidden || !document.hasFocus()) {
      // Sound
      if (soundEnabled) {
        const audio = new Audio('/notification.mp3')
        audio.play().catch(e => console.log('Audio play failed', e))
      }

      // Browser Notification
      if (notificationPermission === 'granted') {
        const title = lastItem.type === 'file' ? 'New File Shared' : 'New Message'
        const body = lastItem.type === 'file' 
          ? `${(lastItem.data as RoomFile).guest_name || 'Someone'} shared a file: ${(lastItem.data as RoomFile).file_name}`
          : `${(lastItem.data as Message).guest_name || 'Someone'}: ${(lastItem.data as Message).content}`
        
        new Notification(title, {
          body,
          icon: '/icon',
          tag: 'peer-pizza-chat'
        })
      }
    }
  }, [feedItems, currentUserId, notificationPermission, soundEnabled])

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  // Check if file is previewable
  const isPreviewable = (fileName: string) => {
    return isImageFile(fileName) || isVideoFile(fileName) || isAudioFile(fileName)
  }

  return (
    <>
      <div className="flex flex-col h-[600px] border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden relative">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Room Chat
          </h3>
          <div className="flex items-center gap-3">
             <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (notificationPermission !== 'granted') {
                  requestPermission()
                }
                setSoundEnabled(!soundEnabled)
              }}
              className="w-6 h-6 text-zinc-400 hover:text-white"
              title={soundEnabled ? 'Mute Notifications' : 'Enable Notifications'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Users className="w-3.5 h-3.5" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-white/10 bg-black/20">
          {[
            { mode: 'quick' as FileMode, label: 'Quick', icon: Database, activeStyles: 'border-blue-500 text-blue-400 bg-blue-500/10' },
            { mode: 'relay' as FileMode, label: 'Relay', icon: Cloud, activeStyles: 'border-violet-500 text-violet-400 bg-violet-500/10' },
            { mode: 'p2p' as FileMode, label: 'P2P', icon: Wifi, activeStyles: 'border-green-500 text-green-400 bg-green-500/10' },
          ].map(({ mode, label, icon: Icon, activeStyles }) => (
            <button
              key={mode}
              onClick={() => setFileMode(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all border-b-2 ${
                fileMode === mode
                  ? activeStyles
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {feedItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            feedItems.map((item, index) => {
              if (item.type === 'system') {
                const event = item.data as SystemEvent
                return (
                  <div key={`system-${index}`} className="flex justify-center">
                    <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
                      {event.userName} {event.type === 'join' ? 'joined' : 'left'}
                    </span>
                  </div>
                )
              }

              if (item.type === 'file') {
                const file = item.data as RoomFile
                const hasPreview = isPreviewable(file.file_name)
                const thumbnailUrl = thumbnailUrls[file.id]
                const isImage = isImageFile(file.file_name)
                const isOwn = currentUserId && file.uploaded_by === currentUserId
                const displayName = file.uploaded_by ? 'User' : file.guest_name || 'Guest'

                return (
                  <div
                    key={`file-${file.id}`}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500">{displayName}</span>
                      <span className="text-xs text-zinc-600">{formatTime(file.created_at)}</span>
                    </div>
                    <div
                      className={`max-w-[80%] p-3 rounded-xl border ${
                        isOwn
                          ? 'bg-orange-600/20 border-orange-500/30 text-white rounded-br-sm'
                          : 'bg-white/5 border-white/10 text-zinc-200 rounded-bl-sm'
                      }`}
                    >
                      {/* Image Thumbnail */}
                      {isImage && thumbnailUrl && (
                        <button
                          onClick={() => openPreview(file)}
                          className="block w-full mb-2 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={thumbnailUrl}
                            alt={file.file_name}
                            className="w-full max-h-48 object-cover rounded-lg"
                          />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isOwn ? 'bg-orange-500/20' : isImage ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                          <FileIcon className={`w-5 h-5 ${isOwn ? 'text-orange-500' : isImage ? 'text-blue-500' : 'text-orange-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.file_name}</p>
                          <p className="text-xs text-zinc-400">
                            {formatFileSize(file.file_size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasPreview && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPreview(file)}
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDownloadFile(file)}
                            className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              const message = item.data as Message
              const isOwn = currentUserId && message.user_id === currentUserId
              const displayName = message.user_id ? 'User' : message.guest_name || 'Guest'

              return (
                <div
                  key={`msg-${message.id}`}
                  className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-zinc-500">{displayName}</span>
                    <span className="text-xs text-zinc-600">{formatTime(message.created_at)}</span>
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      isOwn
                        ? 'bg-orange-600 text-white rounded-br-sm'
                        : 'bg-white/10 text-zinc-200 rounded-bl-sm'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-4 py-1.5 text-xs text-zinc-400 border-t border-white/5 bg-black/20">
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing...`
              : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ` and ${typingUsers.length - 2} more` : ''} are typing...`}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="px-4 py-2 border-t border-white/5 bg-blue-500/10 flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400">Uploading...</span>
          </div>
        )}

        {/* File Mode Picker Overlay */}
        {showFilePicker && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Select File Mode</h3>
                <Button size="icon" variant="ghost" onClick={() => setShowFilePicker(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  {
                    mode: 'quick' as FileMode,
                    label: 'Quick Share',
                    desc: 'Up to 50MB',
                    icon: Database,
                    activeBorderBg: 'border-blue-500 bg-blue-500/10',
                    iconBg: 'bg-blue-500/20',
                    iconText: 'text-blue-500',
                  },
                  {
                    mode: 'relay' as FileMode,
                    label: 'Relay',
                    desc: 'Up to 6GB',
                    icon: Cloud,
                    activeBorderBg: 'border-violet-500 bg-violet-500/10',
                    iconBg: 'bg-violet-500/20',
                    iconText: 'text-violet-500',
                  },
                  {
                    mode: 'p2p' as FileMode,
                    label: 'P2P Direct',
                    desc: 'Unlimited',
                    icon: Wifi,
                    activeBorderBg: 'border-green-500 bg-green-500/10',
                    iconBg: 'bg-green-500/20',
                    iconText: 'text-green-500',
                  },
                ].map(({ mode, label, desc, icon: Icon, activeBorderBg, iconBg, iconText }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setFileMode(mode)
                      fileInputRef.current?.click()
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-white/5 ${
                      fileMode === mode ? activeBorderBg : 'border-white/10'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${iconBg}`}>
                      <Icon className={`w-5 h-5 ${iconText}`} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs text-zinc-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/5">
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowFilePicker(true)}
              className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onBlur={() => onTyping(false)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </form>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        files={files}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewFile(null)
        }}
        onDownload={onDownloadFile}
        getSignedUrl={getSignedUrl}
      />
    </>
  )
}
