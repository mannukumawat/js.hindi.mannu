'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Mail, Lock, User, Loader2 } from 'lucide-react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => Promise<{ error: Error | null }>
  onRegister: (email: string, password: string) => Promise<{ error: Error | null }>
  onForgotPassword: (email: string) => Promise<{ error: Error | null }>
  onGuest?: () => Promise<{ error: Error | null }>
}

export function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onForgotPassword,
  onGuest,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'login') {
        const result = await onLogin(email, password)
        if (result.error) throw result.error
        onClose()
      } else if (mode === 'register') {
        const result = await onRegister(email, password)
        if (result.error) throw result.error
        // Account created + signed in immediately
        onClose()
      } else {
        const result = await onForgotPassword(email)
        if (result.error) throw result.error
        setSuccess('Password reset email sent!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    if (!onGuest) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await onGuest()
      if (result.error) throw result.error
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue as guest')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {mode === 'login' && 'Sign in to save your rooms'}
            {mode === 'register' && 'Register to make rooms permanent'}
            {mode === 'forgot' && 'Enter your email to reset password'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Password (not for forgot mode) */}
          {mode !== 'forgot' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white rounded-xl"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Email'}
              </>
            )}
          </Button>
        </form>

        {/* Guest login */}
        {onGuest && mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <Button
              type="button"
              onClick={handleGuest}
              disabled={loading}
              variant="outline"
              className="w-full h-12 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue as Guest'}
            </Button>
          </>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center text-sm">
          {mode === 'login' && (
            <>
              <button
                onClick={() => {
                  setMode('forgot')
                  resetForm()
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Forgot password?
              </button>
              <div className="mt-3 text-zinc-500">
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('register')
                    resetForm()
                  }}
                  className="text-orange-500 hover:text-orange-400 font-medium"
                >
                  Register
                </button>
              </div>
            </>
          )}

          {mode === 'register' && (
            <div className="text-zinc-500">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('login')
                  resetForm()
                }}
                className="text-orange-500 hover:text-orange-400 font-medium"
              >
                Sign In
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => {
                setMode('login')
                resetForm()
              }}
              className="text-orange-500 hover:text-orange-400 font-medium"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
