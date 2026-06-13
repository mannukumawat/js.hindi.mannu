'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pizza, Plus, ArrowRight, LogIn, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRoom } from '@/hooks/useRoom'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from '@/components/AuthModal'
import { Room } from '@/lib/appwrite'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const { createRoom, joinRoom, getUserRooms, deleteRoom, error: roomError } = useRoom()
  const { user, signIn, signUp, signInAsGuest, resetPassword, isAuthenticated } = useAuth()
  
  const [roomCode, setRoomCode] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  
  // State for user rooms
  const [userRooms, setUserRooms] = useState<Room[]>([])

  // Fetch user rooms when authenticated
  const fetchRooms = React.useCallback(async () => {
    if (user?.id) {
      const rooms = await getUserRooms(user.id)
      if (rooms) setUserRooms(rooms)
    } else {
      setUserRooms([])
    }
  }, [user, getUserRooms])

  React.useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      const success = await deleteRoom(roomId)
      if (success) {
        toast.success('Room deleted')
        fetchRooms() // Refresh list
      } else {
        toast.error('Failed to delete room')
      }
    }
  }

  const handleCreateRoom = async () => {
    setIsCreating(true)
    const room = await createRoom(user?.id)
    if (room) {
      router.push(`/room/${room.room_code}`)
    } else {
      toast.error('Failed to create room')
    }
    setIsCreating(false)
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomCode.trim()) return

    setIsJoining(true)
    const room = await joinRoom(roomCode.trim())
    if (room) {
      router.push(`/room/${room.room_code}`)
    } else {
      toast.error(roomError || 'Room not found')
    }
    setIsJoining(false)
  }

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white/20">
      {/* Background */}
      {/* Background */}
      <div className="fixed inset-0 z-0 h-full w-full bg-black bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
      <div className="fixed inset-0 z-0 bg-linear-to-tr from-violet-500/10 via-transparent to-orange-500/10 blur-3xl"></div>

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
            {isAuthenticated ? (
              <Link href="/profile" className="flex items-center gap-2 text-sm text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="max-w-[150px] truncate">{user?.email}</span>
              </Link>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-zinc-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            v1.9 Room System
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-linear-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-700">
            Files + Chat.<br />Unified.
          </h1>

          <p className="text-xl text-zinc-400 max-w-xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Create a room, share the code, and start sharing files & chatting instantly. No sign-up required.
          </p>

          {/* Action Cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {/* Create Room */}
            <button
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="group p-6 rounded-2xl bg-linear-to-br from-orange-600/20 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:scale-[1.02] text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {isCreating ? (
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                ) : (
                  <Plus className="w-6 h-6 text-orange-500" />
                )}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Create Room</h3>
              <p className="text-sm text-zinc-400">Start a new sharing session</p>
            </button>

            {/* Join Room */}
            <form onSubmit={handleJoinRoom} className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:border-white/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                <ArrowRight className="w-6 h-6 text-violet-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Join Room</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 font-mono tracking-wider text-center"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={roomCode.length !== 6 || isJoining}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* User Rooms */}
      {isAuthenticated && userRooms.length > 0 && (
        <section className="relative z-10 py-8 px-6 bg-white/5 border-y border-white/10">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Pizza className="w-6 h-6 text-orange-500" />
              Your Permanent Rooms
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {userRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.room_code}`}
                  className="block p-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-orange-500/50 hover:bg-zinc-800 transition-all group relative"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                    onClick={(e) => handleDeleteRoom(e, room.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Code</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="text-3xl font-mono font-bold text-white tracking-wider group-hover:text-orange-100">
                    {room.room_code}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Created {new Date(room.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="relative z-10 py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-white">24h</div>
              <div className="text-sm text-zinc-500">Auto-cleanup</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white">∞</div>
              <div className="text-sm text-zinc-500">P2P file size</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-white">6GB</div>
              <div className="text-sm text-zinc-500">Relay mode limit</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10 bg-black">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <Pizza className="w-6 h-6" />
              <span className="font-bold text-lg">PeerPizza</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="mailto:vishvajeet4711@gmail.com" className="text-zinc-400 hover:text-white transition-colors">
                Contact
              </a>
              <a href="https://www.linkedin.com/in/vishvajeet-shukla/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="https://vishvajeetshukla.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                Portfolio
              </a>
            </div>
            <div className="text-xs text-zinc-600">
              © {new Date().getFullYear()} PeerPizza • Made in India 🇮🇳
            </div>
          </div>
        </div>
      </footer>

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
