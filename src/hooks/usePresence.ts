'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  databases,
  appwriteClient,
  APPWRITE_DATABASE_ID as DB,
  COLLECTIONS,
  ID,
  Query,
  collectionChannel,
} from '@/lib/appwrite'

interface PresenceUser {
  id: string
  name: string
  joinedAt: string
}

interface SystemEvent {
  type: 'join' | 'leave'
  userName: string
  timestamp: string
}

interface Tracked {
  name: string
  isTyping: boolean
  updatedAt: number
}

const C = COLLECTIONS.presence
const HEARTBEAT_MS = 10000 // touch our doc every 10s
const STALE_MS = 30000 // drop users not seen in 30s
const SWEEP_MS = 5000 // re-derive online/typing from the map periodically

// Appwrite has no native presence/broadcast like Supabase, so we model it with a
// `presence` collection: each session keeps one doc fresh (heartbeat), subscribes
// to realtime changes, and derives online + typing lists, dropping stale docs.
export function usePresence(roomId: string | null, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([])
  const [myPresenceId, setMyPresenceId] = useState<string | null>(null)

  const docIdRef = useRef<string | null>(null)
  const usersRef = useRef<Map<string, Tracked>>(new Map())
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)
  const nameRef = useRef(userName)
  nameRef.current = userName

  const recompute = useCallback(() => {
    const now = Date.now()
    const online: PresenceUser[] = []
    const typing: string[] = []

    usersRef.current.forEach((u, id) => {
      if (now - u.updatedAt > STALE_MS) {
        usersRef.current.delete(id)
        return
      }
      online.push({ id, name: u.name, joinedAt: new Date(u.updatedAt).toISOString() })
      if (u.isTyping && u.name !== nameRef.current) typing.push(u.name)
    })

    setOnlineUsers(online)
    setTypingUsers([...new Set(typing)])
  }, [])

  useEffect(() => {
    if (!roomId || !userName) return

    let cancelled = false
    const docId = ID.unique()
    docIdRef.current = docId
    setMyPresenceId(docId)

    const join = async () => {
      try {
        await databases.createDocument(DB, C, docId, {
          room_id: roomId,
          name: userName,
          is_typing: false,
        } as any)
      } catch {
        /* ignore — heartbeat will recreate if needed */
      }

      try {
        const res = await databases.listDocuments(DB, C, [
          Query.equal('room_id', roomId),
          Query.limit(100),
        ])
        if (cancelled) return
        res.documents.forEach((d: any) => {
          usersRef.current.set(d.$id, {
            name: d.name,
            isTyping: !!d.is_typing,
            updatedAt: new Date(d.$updatedAt).getTime(),
          })
        })
        recompute()
      } catch {
        /* ignore */
      }
    }
    join()

    const unsubscribe = appwriteClient.subscribe(collectionChannel(C), (res: any) => {
      const d = res.payload
      if (!d || d.room_id !== roomId) return

      const isDelete = res.events?.some((e: string) => e.endsWith('.delete'))
      const isCreate = res.events?.some((e: string) => e.endsWith('.create'))

      if (isDelete) {
        usersRef.current.delete(d.$id)
        if (d.$id !== docIdRef.current) {
          setSystemEvents((prev) => [
            ...prev,
            { type: 'leave', userName: d.name, timestamp: new Date().toISOString() },
          ])
        }
      } else {
        const existed = usersRef.current.has(d.$id)
        usersRef.current.set(d.$id, {
          name: d.name,
          isTyping: !!d.is_typing,
          updatedAt: new Date(d.$updatedAt).getTime(),
        })
        if (isCreate && !existed && d.$id !== docIdRef.current) {
          setSystemEvents((prev) => [
            ...prev,
            { type: 'join', userName: d.name, timestamp: new Date().toISOString() },
          ])
        }
      }
      recompute()
    })

    const heartbeat = setInterval(async () => {
      const id = docIdRef.current
      if (!id) return
      try {
        await databases.updateDocument(DB, C, id, {
          is_typing: isTypingRef.current,
          name: nameRef.current,
        } as any)
      } catch {
        // doc may have been swept — recreate it
        try {
          await databases.createDocument(DB, C, id, {
            room_id: roomId,
            name: nameRef.current,
            is_typing: isTypingRef.current,
          } as any)
        } catch {
          /* ignore */
        }
      }
    }, HEARTBEAT_MS)

    const sweeper = setInterval(recompute, SWEEP_MS)

    return () => {
      cancelled = true
      clearInterval(heartbeat)
      clearInterval(sweeper)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      try {
        unsubscribe()
      } catch {
        /* noop */
      }
      const id = docIdRef.current
      if (id) databases.deleteDocument(DB, C, id).catch(() => {})
      usersRef.current.clear()
      docIdRef.current = null
    }
  }, [roomId, userName, recompute])

  // Typing — only write on state transitions to keep DB writes minimal
  const setTyping = useCallback((isTyping: boolean) => {
    const changed = isTypingRef.current !== isTyping
    isTypingRef.current = isTyping

    const id = docIdRef.current
    if (changed && id) {
      databases.updateDocument(DB, C, id, { is_typing: isTyping } as any).catch(() => {})
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false
        const id2 = docIdRef.current
        if (id2) {
          databases.updateDocument(DB, C, id2, { is_typing: false } as any).catch(() => {})
        }
      }, 3000)
    }
  }, [])

  return {
    onlineUsers,
    typingUsers,
    systemEvents,
    setTyping,
    myPresenceId,
  }
}
