'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  databases,
  appwriteClient,
  APPWRITE_DATABASE_ID as DB,
  COLLECTIONS,
  ID,
  Query,
  collectionChannel,
  Message,
  mapMessage,
} from '@/lib/appwrite'

const C = COLLECTIONS.messages

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial messages
  useEffect(() => {
    if (!roomId) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await databases.listDocuments(DB, C, [
          Query.equal('room_id', roomId),
          Query.orderAsc('$createdAt'),
          Query.limit(200),
        ])
        setMessages(res.documents.map(mapMessage))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [roomId])

  // Subscribe to real-time inserts
  useEffect(() => {
    if (!roomId) return

    console.log(`[Chat] Subscribing to room: ${roomId}`)

    const unsubscribe = appwriteClient.subscribe(collectionChannel(C), (res: any) => {
      const isCreate = res.events?.some((e: string) => e.endsWith('.create'))
      if (!isCreate) return

      const doc = res.payload
      if (!doc || doc.room_id !== roomId) return

      const newMessage = mapMessage(doc)
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev
        }

        // Find optimistic message (generated with randomUUID, containing hyphens)
        const optIndex = prev.findIndex(
          (m) =>
            m.id.includes('-') &&
            m.content === newMessage.content &&
            m.user_id === newMessage.user_id &&
            m.guest_name === newMessage.guest_name
        )

        if (optIndex !== -1) {
          const next = [...prev]
          next[optIndex] = newMessage
          return next
        }

        return [...prev, newMessage]
      })
    })

    return () => {
      console.log(`[Chat] Unsubscribing from ${roomId}`)
      try {
        unsubscribe()
      } catch {
        /* noop */
      }
    }
  }, [roomId])

  const sendMessage = useCallback(
    async (content: string, userId?: string, guestName?: string) => {
      if (!roomId || !content.trim()) return null

      const optimisticId = crypto.randomUUID()
      const optimisticMessage: Message = {
        id: optimisticId,
        room_id: roomId,
        user_id: userId || null,
        guest_name: guestName || 'Guest',
        content: content.trim(),
        created_at: new Date().toISOString(),
      }

      // Optimistic update
      setMessages((prev) => [...prev, optimisticMessage])

      try {
        const doc = await databases.createDocument(DB, C, ID.unique(), {
          room_id: roomId,
          user_id: userId || null,
          guest_name: guestName || 'Guest',
          content: content.trim(),
        } as any)

        const saved = mapMessage(doc)

        // Replace optimistic with the real doc (realtime echo is de-duped by id)
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? saved : m)))
        return saved
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message')
        // Rollback optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        return null
      }
    },
    [roomId],
  )

  return {
    messages,
    loading,
    error,
    sendMessage,
  }
}
