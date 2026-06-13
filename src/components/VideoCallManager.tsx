'use client'

import React, { useRef, useEffect } from 'react'
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  Camera, 
  Loader2,
  Volume2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CallState } from '@/hooks/useVideoCall'

interface VideoCallManagerProps {
  callState: CallState
  callType: 'video' | 'audio'
  remoteUserName: string
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMicMuted: boolean
  isCamOff: boolean
  onlineUsers: { id: string; name: string; joinedAt: string }[]
  myPresenceId: string | null
  onStartCall: (peerId: string, type?: 'video' | 'audio') => void
  onAnswerCall: () => void
  onDeclineCall: () => void
  onToggleMute: () => void
  onToggleCamera: () => void
  onClosePanel: () => void
}

export function VideoCallManager({
  callState,
  callType,
  remoteUserName,
  localStream,
  remoteStream,
  isMicMuted,
  isCamOff,
  onlineUsers,
  myPresenceId,
  onStartCall,
  onAnswerCall,
  onDeclineCall,
  onToggleMute,
  onToggleCamera,
  onClosePanel
}: VideoCallManagerProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const lobbyVideoRef = useRef<HTMLVideoElement>(null)

  // Bind local stream to active call local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, callState])

  // Bind remote stream to active call remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, callState])

  // Start preview in lobby/idle mode
  useEffect(() => {
    let previewStream: MediaStream | null = null

    if (callState === 'idle' && lobbyVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          previewStream = stream
          if (lobbyVideoRef.current) {
            lobbyVideoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          console.warn('Lobby camera preview not available:', err)
        })
    }

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [callState])

  // Filter out the local user from the list of peers to call
  const otherUsers = onlineUsers.filter(u => u.id !== myPresenceId)

  return (
    <Card className="flex flex-col h-[600px] border border-white/10 rounded-2xl bg-zinc-950/60 backdrop-blur-md overflow-hidden relative shadow-2xl">
      {/* Active Call State Interface */}
      {callState === 'active' && (
        <div className="relative w-full h-full bg-black flex items-center justify-center">
          {callType === 'video' ? (
            <>
              {/* Remote Video (Full Screen) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video (Floating PiP) */}
              {localStream && !isCamOff ? (
                <div className="absolute top-4 right-4 w-32 md:w-40 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-lg z-10 transition-all hover:scale-105">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              ) : (
                <div className="absolute top-4 right-4 w-32 md:w-40 aspect-video rounded-xl bg-zinc-800 border border-white/20 shadow-lg z-10 flex items-center justify-center">
                  <VideoOff className="w-5 h-5 text-zinc-500" />
                </div>
              )}
            </>
          ) : (
            /* Voice Call UI */
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-pulse scale-150"></div>
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-violet-600 to-orange-600 flex items-center justify-center shadow-lg border border-white/20">
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Voice Call Active</h2>
              <p className="text-orange-400 font-semibold text-sm">{remoteUserName}</p>
              
              {/* Audio playback via hidden video element */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="hidden"
              />
            </div>
          )}

          {/* Overlaid Caller Name */}
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white border border-white/10">
            {callType === 'video' ? 'Talking to: ' : 'Voice call with: '}<span className="font-semibold text-orange-400">{remoteUserName}</span>
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-zinc-950/70 border border-white/10 backdrop-blur-md rounded-full shadow-2xl z-20">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleMute}
              className={`w-11 h-11 rounded-full transition-all duration-300 ${
                isMicMuted 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {callType === 'video' && (
              <Button
                size="icon"
                variant="ghost"
                onClick={onToggleCamera}
                className={`w-11 h-11 rounded-full transition-all duration-300 ${
                  isCamOff 
                    ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}
              >
                {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </Button>
            )}

            <Button
              size="icon"
              onClick={onDeclineCall}
              className="w-12 h-12 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-red-600/30"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialing State Interface */}
      {callState === 'dialing' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-white">
          <div className="relative mb-8">
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping scale-150"></div>
            <div className="absolute inset-0 bg-violet-500/15 rounded-full animate-ping scale-125 duration-1000"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-violet-600 to-orange-600 flex items-center justify-center shadow-lg border border-white/20">
              <PhoneCall className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Calling {remoteUserName}{callType === 'audio' ? ' (Voice)' : ''}...</h2>
          <p className="text-zinc-400 text-sm mb-12 animate-pulse">Waiting for connection</p>
          
          <Button
            onClick={onDeclineCall}
            className="px-6 py-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold"
          >
            <PhoneOff className="w-4 h-4" /> Cancel Call
          </Button>
        </div>
      )}

      {/* Incoming Call State Interface */}
      {callState === 'incoming' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-white">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping scale-150"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg border border-white/20">
              <Volume2 className="w-10 h-10 text-white animate-bounce" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Incoming {callType === 'audio' ? 'Voice' : 'Video'} Call</h2>
          <p className="text-orange-400 font-semibold text-lg mb-12">{remoteUserName} is calling you</p>
          
          <div className="flex gap-6">
            <Button
              onClick={onDeclineCall}
              className="px-6 py-5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold"
            >
              <PhoneOff className="w-4 h-4" /> Decline
            </Button>
            <Button
              onClick={onAnswerCall}
              className="px-6 py-5 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg shadow-green-600/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-semibold"
            >
              <Phone className="w-4 h-4" /> Answer
            </Button>
          </div>
        </div>
      )}

      {/* Idle / Setup Lobby Interface */}
      {callState === 'idle' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-orange-500" />
              Video Calling Lobby
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClosePanel} 
              className="text-zinc-400 hover:text-white"
            >
              Close
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden min-h-0">
            {/* Camera Preview */}
            <div className="relative bg-black border-r border-white/10 flex items-center justify-center p-4">
              <video
                ref={lobbyVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-xl scale-x-[-1]"
              />
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/60 border border-white/10 backdrop-blur-sm rounded-full text-xs text-zinc-300">
                Camera Preview Mode
              </div>
            </div>

            {/* Online Users List */}
            <div className="flex flex-col p-4 overflow-y-auto bg-zinc-950/20">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Select peer to call
              </h4>

              {otherUsers.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Loader2 className="w-8 h-8 text-orange-500/50 animate-spin mb-4" />
                  <p className="text-zinc-400 text-sm font-medium">Waiting for others to join...</p>
                  <p className="text-zinc-600 text-xs mt-1">
                    Share the room code with your friend to connect in video call!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {otherUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-500">Online since {new Date(user.joinedAt).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => onStartCall(user.id, 'audio')}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5 text-green-500" /> Voice
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onStartCall(user.id, 'video')}
                          className="bg-orange-600 hover:bg-orange-500 text-white rounded-lg flex items-center gap-1.5 text-xs font-semibold"
                        >
                          <Video className="w-3.5 h-3.5" /> Video
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
