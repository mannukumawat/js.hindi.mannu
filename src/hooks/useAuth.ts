'use client'

import { useState, useEffect, useCallback } from 'react'
import { account, ID } from '@/lib/appwrite'

export interface AppUser {
  id: string
  email: string
  name: string
  isGuest: boolean
}

type AuthResult = { error: Error | null }

function mapUser(u: any): AppUser {
  return {
    id: u.$id,
    email: u.email || '',
    name: u.name || '',
    // anonymous (guest) sessions have no email registered
    isGuest: !u.email,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Appwrite has no onAuthStateChange — we refresh from account.get() after each action.
  const refresh = useCallback(async () => {
    try {
      const u = await account.get()
      setUser(mapUser(u))
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    try {
      await account.create(ID.unique(), email, password)
      await account.createEmailPasswordSession(email, password)
      await refresh()
      return { error: null }
    } catch (e) {
      setLoading(false)
      return { error: e as Error }
    }
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true)
    try {
      await account.createEmailPasswordSession(email, password)
      await refresh()
      return { error: null }
    } catch (e) {
      setLoading(false)
      return { error: e as Error }
    }
  }, [refresh])

  // Guest login = Appwrite anonymous session
  const signInAsGuest = useCallback(async (): Promise<AuthResult> => {
    setLoading(true)
    try {
      await account.createAnonymousSession()
      await refresh()
      return { error: null }
    } catch (e) {
      setLoading(false)
      return { error: e as Error }
    }
  }, [refresh])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    setLoading(true)
    try {
      await account.deleteSession('current')
      setUser(null)
      return { error: null }
    } catch (e) {
      return { error: e as Error }
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await account.createRecovery(email, `${window.location.origin}/reset-password`)
      return { error: null }
    } catch (e) {
      return { error: e as Error }
    }
  }, [])

  const updatePassword = useCallback(async (password: string): Promise<AuthResult> => {
    setLoading(true)
    try {
      await account.updatePassword(password)
      return { error: null }
    } catch (e) {
      return { error: e as Error }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    user,
    loading,
    signUp,
    signIn,
    signInAsGuest,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  }
}
