'use client'

import { useState, useCallback } from 'react'
import {
  databases,
  APPWRITE_DATABASE_ID as DB,
  COLLECTIONS,
  ID,
  Query,
  Room,
  mapRoom,
} from '@/lib/appwrite'

const C = COLLECTIONS.rooms
const TTL_MS = 24 * 60 * 60 * 1000 // 24h

// Generate random 6-digit code
function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createRoom = useCallback(async (userId?: string) => {
    setLoading(true)
    setError(null)

    const insert = (code: string) =>
      databases.createDocument(DB, C, ID.unique(), {
        room_code: code,
        created_by: userId || null,
        is_permanent: false,
        expires_at: new Date(Date.now() + TTL_MS).toISOString(),
      } as any)

    try {
      try {
        const doc = await insert(generateRoomCode())
        const r = mapRoom(doc)
        setRoom(r)
        return r
      } catch (err: any) {
        // 409 = unique room_code collision — retry once with a fresh code
        if (err?.code === 409) {
          const doc = await insert(generateRoomCode())
          const r = mapRoom(doc)
          setRoom(r)
          return r
        }
        throw err
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create room')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const joinRoom = useCallback(async (roomCode: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await databases.listDocuments(DB, C, [
        Query.equal('room_code', roomCode),
        Query.limit(1),
      ])

      if (res.total === 0 || res.documents.length === 0) {
        throw new Error('Room not found')
      }

      const r = mapRoom(res.documents[0])

      // Check expiry
      if (r.expires_at && new Date(r.expires_at) < new Date() && !r.is_permanent) {
        throw new Error('Room has expired')
      }

      setRoom(r)
      return r
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join room')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const makePermanent = useCallback(async (roomId: string, userId: string) => {
    setLoading(true)
    setError(null)

    try {
      const doc = await databases.updateDocument(DB, C, roomId, {
        is_permanent: true,
        created_by: userId,
        expires_at: null,
      } as any)

      const r = mapRoom(doc)
      setRoom(r)
      return r
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to make room permanent'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getRoomById = useCallback(async (roomId: string) => {
    setLoading(true)
    setError(null)

    try {
      const doc = await databases.getDocument(DB, C, roomId)
      const r = mapRoom(doc)
      setRoom(r)
      return r
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get room')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    room,
    loading,
    error,
    createRoom,
    joinRoom,
    makePermanent,
    getRoomById,
    getUserRooms: useCallback(async (userId: string) => {
      setLoading(true)
      setError(null)

      try {
        const res = await databases.listDocuments(DB, C, [
          Query.equal('created_by', userId),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
        ])
        return res.documents.map(mapRoom)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get user rooms')
        return []
      } finally {
        setLoading(false)
      }
    }, []),

    deleteRoom: useCallback(async (roomId: string) => {
      setLoading(true)
      setError(null)

      try {
        await databases.deleteDocument(DB, C, roomId)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete room')
        return false
      } finally {
        setLoading(false)
      }
    }, []),
  }
}
