'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type Peer from 'peerjs'
import type { MediaConnection } from 'peerjs'
import { toast } from 'sonner'

export type CallState = 'idle' | 'dialing' | 'incoming' | 'active'

interface UseVideoCallProps {
  myPresenceId: string | null
  onlineUsers: { id: string; name: string; joinedAt: string }[]
}

// Programmatic Ringtone / Dialing Sound using Web Audio API
class SoundGenerator {
  private ctx: AudioContext | null = null
  private interval: any = null

  startRinging(mode: 'incoming' | 'outgoing') {
    this.stop()
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    this.ctx = new AudioContextClass()

    const playBeep = (freq: number, duration: number) => {
      if (!this.ctx || this.ctx.state === 'closed') return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime)
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration)
      osc.start()
      osc.stop(this.ctx.currentTime + duration)
    }

    if (mode === 'incoming') {
      // Periodic ring: double-beep then pause
      this.interval = setInterval(() => {
        playBeep(480, 0.2)
        setTimeout(() => playBeep(440, 0.2), 250)
      }, 2000)
    } else {
      // Outgoing call tone: single longer beep
      this.interval = setInterval(() => {
        playBeep(400, 0.8)
      }, 2200)
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}

export function useVideoCall({ myPresenceId, onlineUsers }: UseVideoCallProps) {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [callState, setCallState] = useState<CallState>('idle')
  const [callType, setCallType] = useState<'video' | 'audio'>('video')
  const [activeCall, setActiveCall] = useState<MediaConnection | null>(null)
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null)
  const [remoteUserName, setRemoteUserName] = useState<string>('')
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)

  const peerRef = useRef<Peer | null>(null)
  const activeCallRef = useRef<MediaConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const soundGeneratorRef = useRef<SoundGenerator | null>(null)
  const dialTimeoutRef = useRef<any>(null)

  // Initialize Sound Generator on Client Side
  useEffect(() => {
    soundGeneratorRef.current = new SoundGenerator()
    return () => {
      if (soundGeneratorRef.current) {
        soundGeneratorRef.current.stop()
      }
    }
  }, [])

  // Resolve Peer ID to User Name
  const getUserName = useCallback((peerId: string) => {
    const user = onlineUsers.find(u => u.id === peerId)
    return user ? user.name : 'Unknown User'
  }, [onlineUsers])

  // Cleanup helper
  const endCallCleanup = useCallback(() => {
    if (dialTimeoutRef.current) {
      clearTimeout(dialTimeoutRef.current)
      dialTimeoutRef.current = null
    }
    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.stop()
    }
    if (activeCallRef.current) {
      activeCallRef.current.close()
      activeCallRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    setCallState('idle')
    setCallType('video')
    setActiveCall(null)
    setRemotePeerId(null)
    setRemoteUserName('')
    setLocalStream(null)
    setRemoteStream(null)
    setIsMicMuted(false)
    setIsCamOff(false)
  }, [])

  // Initialize PeerJS
  useEffect(() => {
    if (!myPresenceId) return

    let isMounted = true
    let peerInstance: Peer | null = null

    const initPeer = async () => {
      try {
        const { default: PeerClass } = await import('peerjs')
        
        const peerOptions = {
          host: process.env.NEXT_PUBLIC_PEER_HOST || '0.peerjs.com',
          port: parseInt(process.env.NEXT_PUBLIC_PEER_PORT || '443'),
          path: process.env.NEXT_PUBLIC_PEER_PATH || '/',
          secure: process.env.NEXT_PUBLIC_PEER_SECURE !== 'false',
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        }

        peerInstance = new PeerClass(myPresenceId, peerOptions)
        peerRef.current = peerInstance

        peerInstance.on('open', (id) => {
          if (isMounted) {
            setPeer(peerInstance)
            console.log('Video call peer registered with ID:', id)
          }
        })

        // Listen for incoming calls
        peerInstance.on('call', (incomingCall) => {
          if (activeCallRef.current || callState !== 'idle') {
            // Busy, auto-decline
            incomingCall.answer() // Answer with nothing
            incomingCall.close()
            return
          }

          const incomingCallType = incomingCall.metadata?.callType || 'video'
          setCallType(incomingCallType)
          if (incomingCallType === 'audio') {
            setIsCamOff(true)
          }

          activeCallRef.current = incomingCall
          setActiveCall(incomingCall)
          setRemotePeerId(incomingCall.peer)
          setRemoteUserName(getUserName(incomingCall.peer))
          setCallState('incoming')
          
          if (soundGeneratorRef.current) {
            soundGeneratorRef.current.startRinging('incoming')
          }

          // Handle incoming call close/disconnect
          incomingCall.on('close', () => {
            endCallCleanup()
          })

          if (incomingCall.peerConnection) {
            incomingCall.peerConnection.oniceconnectionstatechange = () => {
              const state = incomingCall.peerConnection.iceConnectionState
              if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                endCallCleanup()
              }
            }
          }
        })

        peerInstance.on('error', (err) => {
          console.error('PeerJS Video Call Error:', err)
          if (err.type === 'peer-unavailable') {
            toast.error('The selected user is offline or busy.')
            endCallCleanup()
          }
        })

      } catch (err) {
        console.error('Failed to import or init PeerJS:', err)
      }
    }

    initPeer()

    return () => {
      isMounted = false
      endCallCleanup()
      if (peerInstance) {
        peerInstance.destroy()
      }
    }
  }, [myPresenceId, getUserName, endCallCleanup])

  // Start Call (Dialing)
  const startCall = useCallback(async (targetPeerId: string, type: 'video' | 'audio' = 'video') => {
    if (!peerRef.current || !targetPeerId) return

    setCallState('dialing')
    setCallType(type)
    if (type === 'audio') {
      setIsCamOff(true)
    }
    setRemotePeerId(targetPeerId)
    const name = getUserName(targetPeerId)
    setRemoteUserName(name)

    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.startRinging('outgoing')
    }

    try {
      // Request local camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      })

      setLocalStream(stream)
      localStreamRef.current = stream

      // Call the remote peer with metadata
      const outgoingCall = peerRef.current.call(targetPeerId, stream, {
        metadata: { callType: type }
      })
      activeCallRef.current = outgoingCall
      setActiveCall(outgoingCall)

      // Outgoing call handlers
      outgoingCall.on('stream', (remStream) => {
        if (soundGeneratorRef.current) {
          soundGeneratorRef.current.stop()
        }
        if (dialTimeoutRef.current) {
          clearTimeout(dialTimeoutRef.current)
          dialTimeoutRef.current = null
        }
        setCallState('active')
        setRemoteStream(remStream)
      })

      outgoingCall.on('close', () => {
        endCallCleanup()
      })

      if (outgoingCall.peerConnection) {
        outgoingCall.peerConnection.oniceconnectionstatechange = () => {
          const state = outgoingCall.peerConnection.iceConnectionState
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            endCallCleanup()
          }
        }
      }

      // Ring timeout (30 seconds)
      dialTimeoutRef.current = setTimeout(() => {
        toast.warning('No answer.')
        endCallCleanup()
      }, 30000)

    } catch (err: any) {
      console.error('Failed to get user media for calling:', err)
      toast.error('Could not access camera/microphone. Please check permissions.')
      endCallCleanup()
    }
  }, [getUserName, endCallCleanup])

  // Answer Incoming Call
  const answerCall = useCallback(async () => {
    const call = activeCallRef.current
    if (!call || callState !== 'incoming') return

    if (soundGeneratorRef.current) {
      soundGeneratorRef.current.stop()
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true,
      })

      setLocalStream(stream)
      localStreamRef.current = stream

      call.answer(stream)
      setCallState('active')

      call.on('stream', (remStream) => {
        setRemoteStream(remStream)
      })

    } catch (err) {
      console.error('Failed to get user media to answer call:', err)
      toast.error('Could not access camera/microphone. Call declined.')
      // Reject call by closing it
      call.close()
      endCallCleanup()
    }
  }, [callState, callType, endCallCleanup])

  // Decline/Hang Up Call
  const declineCall = useCallback(() => {
    endCallCleanup()
  }, [endCallCleanup])

  // Toggle Microphone
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMicMuted(!localStreamRef.current.getAudioTracks()[0]?.enabled)
    }
  }, [])

  // Toggle Camera
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current && callType === 'video') {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsCamOff(!localStreamRef.current.getVideoTracks()[0]?.enabled)
    }
  }, [callType])

  // Update userName dynamically when typing or presence updates names
  useEffect(() => {
    if (remotePeerId) {
      setRemoteUserName(getUserName(remotePeerId))
    }
  }, [onlineUsers, remotePeerId, getUserName])

  return {
    peer,
    callState,
    callType,
    remotePeerId,
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
  }
}
