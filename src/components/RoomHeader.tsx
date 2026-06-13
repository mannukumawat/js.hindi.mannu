'use client'

import React, { useState, useEffect } from 'react'
import { Room } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import { Copy, Check, Clock, Crown, Share2, Video } from 'lucide-react'
import { toast } from 'sonner'

interface RoomHeaderProps {
  room: Room
  isAuthenticated: boolean
  onMakePermanent: () => void
  onOpenAuth: () => void
  guestName?: string
  onUpdateGuestName?: (name: string) => void
  isCallPanelOpen?: boolean
  onToggleCallPanel?: () => void
}

export function RoomHeader({
  room,
  isAuthenticated,
  onMakePermanent,
  onOpenAuth,
  guestName,
  onUpdateGuestName,
  isCallPanelOpen = false,
  onToggleCallPanel,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')

  useEffect(() => {
    if (guestName) setTempName(guestName)
  }, [guestName])

  // Calculate time remaining
  useEffect(() => {
    if (room.is_permanent || !room.expires_at) {
      setTimeLeft('')
      return
    }

    const expiresAt = room.expires_at

    const updateTimer = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeLeft(`${minutes}m remaining`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [room.expires_at, room.is_permanent])

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareRoom = async () => {
    const url = `${window.location.origin}/room/${room.room_code}`
    if (navigator.share) {
      await navigator.share({
        title: 'Join my PeerPizza room',
        text: `Join room ${room.room_code}`,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Room link copied!')
    }
  }

  const handleSaveName = () => {
    if (tempName.trim() && onUpdateGuestName) {
      onUpdateGuestName(tempName.trim())
      setIsEditingName(false)
      toast.success('Name updated!')
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Room Code */}
        <div className="flex items-center gap-2">
          <div className="text-2xl font-mono font-bold text-white tracking-wider">
            {room.room_code}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyRoomCode}
            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        {/* Status Badge */}
        {room.is_permanent ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
            <Crown className="w-3 h-3" />
            Permanent
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            {timeLeft}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Name Edit (Only for non-authenticated or if we want guests to edit their session name) */}
        {!isAuthenticated && onUpdateGuestName ? (
          isEditingName ? (
            <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-white/10">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="w-24 bg-transparent border-none text-sm text-white focus:outline-none px-2"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:bg-green-500/10" onClick={handleSaveName}>
                <Check className="w-3 h-3" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 text-red-500 hover:bg-red-500/10" 
                onClick={() => {
                  setTempName(guestName || '')
                  setIsEditingName(false)
                }}
              >
                <span className="sr-only">Cancel</span>
                <span className="text-xs">✕</span>
              </Button>
            </div>
          ) : (
             <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingName(true)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
            >
              {guestName || 'Guest'}
            </Button>
          )
        ) : null}

        {/* Share Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={shareRoom}
          className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>

        {/* Video Call Button */}
        {onToggleCallPanel && (
          <Button
            variant={isCallPanelOpen ? "default" : "outline"}
            size="sm"
            onClick={onToggleCallPanel}
            className={
              isCallPanelOpen
                ? "bg-orange-600 hover:bg-orange-500 text-white border-none"
                : "border-white/10 bg-white/5 hover:bg-white/10 text-white"
            }
          >
            <Video className="w-4 h-4 mr-2" />
            {isCallPanelOpen ? 'Close Call' : 'Video Call'}
          </Button>
        )}

        {/* Make Permanent Button */}
        {!room.is_permanent && (
          <Button
            size="sm"
            onClick={isAuthenticated ? onMakePermanent : onOpenAuth}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            {isAuthenticated ? 'Make Permanent' : 'Register to Save Room'}
          </Button>
        )}
      </div>
    </div>
  )
}
