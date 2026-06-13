'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pizza, ArrowLeft, Loader2, LogOut, Key, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function ProfilePage() {
  const router = useRouter()
  const { user, signOut, updatePassword, loading, isAuthenticated } = useAuth()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/')
    }
  }, [loading, isAuthenticated, router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setUpdating(true)
    const { error } = await updatePassword(password)
    
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      setPassword('')
      setConfirmPassword('')
    }
    setUpdating(false)
  }

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-black text-white">
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
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-2xl">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Profile Info */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Signed in as</p>
                  <p className="font-mono text-lg text-white">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-zinc-400" />
                Change Password
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="Enter new password"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!password || !confirmPassword || updating}
                  className="w-full bg-orange-600 hover:bg-orange-500"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
