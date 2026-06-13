'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  databases,
  storage,
  appwriteClient,
  APPWRITE_DATABASE_ID as DB,
  COLLECTIONS,
  BUCKET_ID,
  ID,
  Query,
  collectionChannel,
  RoomFile,
  mapFile,
} from '@/lib/appwrite'

const C = COLLECTIONS.roomFiles
const MAX_FILE_SIZE = 50_000_000 // 50MB — Appwrite Cloud per-file cap on this plan

export function useAppwriteFiles(roomId: string | null) {
  const [files, setFiles] = useState<RoomFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial files
  const fetchFiles = useCallback(async () => {
    if (!roomId) return

    try {
      const res = await databases.listDocuments(DB, C, [
        Query.equal('room_id', roomId),
        Query.orderAsc('$createdAt'),
        Query.limit(200),
      ])
      setFiles(res.documents.map(mapFile))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files')
    }
  }, [roomId])

  // Subscribe to realtime inserts
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = appwriteClient.subscribe(collectionChannel(C), (res: any) => {
      const isCreate = res.events?.some((e: string) => e.endsWith('.create'))
      if (!isCreate) return

      const doc = res.payload
      if (!doc || doc.room_id !== roomId) return

      const newFile = mapFile(doc)
      setFiles((prev) => (prev.some((f) => f.id === newFile.id) ? prev : [...prev, newFile]))
    })

    return () => {
      try {
        unsubscribe()
      } catch {
        /* noop */
      }
    }
  }, [roomId])

  const uploadFile = useCallback(
    async (file: File, userId?: string, guestName?: string) => {
      if (!roomId) return null

      if (file.size > MAX_FILE_SIZE) {
        setError('File size exceeds 50MB limit. Use P2P or Relay for larger files.')
        return null
      }

      setUploading(true)
      setProgress(0)
      setError(null)

      try {
        // Upload to Appwrite Storage
        const fileId = ID.unique()
        await storage.createFile(BUCKET_ID, fileId, file, undefined, (p) => {
          setProgress(Math.round(p.progress))
        })

        setProgress(100)

        // Save metadata. storage_path = Appwrite file id (relay files use a "relay:" prefix instead).
        const doc = await databases.createDocument(DB, C, ID.unique(), {
          room_id: roomId,
          file_name: file.name,
          file_size: file.size,
          storage_path: fileId,
          uploaded_by: userId || null,
          guest_name: guestName || 'Guest',
        } as any)

        const saved = mapFile(doc)
        setFiles((prev) => (prev.some((f) => f.id === saved.id) ? prev : [saved, ...prev]))
        return saved
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        return null
      } finally {
        setUploading(false)
      }
    },
    [roomId],
  )

  const getDownloadUrl = useCallback(async (storagePath: string) => {
    if (storagePath.startsWith('relay:')) return null
    return storage.getFileView(BUCKET_ID, storagePath)
  }, [])

  const downloadFile = useCallback(async (file: RoomFile) => {
    // Relay (Cloudflare R2) files
    if (file.storage_path.startsWith('relay:')) {
      try {
        const pathWithoutPrefix = file.storage_path.slice(6) // remove 'relay:'
        const firstColonIndex = pathWithoutPrefix.indexOf(':')
        if (firstColonIndex === -1) return

        const relayRoomId = pathWithoutPrefix.substring(0, firstColonIndex)
        const fileName = pathWithoutPrefix.substring(firstColonIndex + 1)

        const response = await fetch(`/api/download/${relayRoomId}`)
        if (!response.ok) throw new Error('Failed to get download URL')

        const data = await response.json()
        const targetFile = data.files.find((f: any) => f.fileName === fileName)

        if (targetFile?.downloadUrl) {
          const link = document.createElement('a')
          link.href = targetFile.downloadUrl
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          window.open(`/share/${relayRoomId}?mode=cloud`, '_blank')
        }
      } catch (err) {
        console.error('Download error:', err)
        const relayRoomId = file.storage_path.split(':')[1]
        window.open(`/share/${relayRoomId}?mode=cloud`, '_blank')
      }
      return
    }

    // Appwrite Storage files — getFileDownload forces a download disposition
    const url = storage.getFileDownload(BUCKET_ID, file.storage_path)
    const link = document.createElement('a')
    link.href = url
    link.download = file.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
    files,
    uploading,
    progress,
    error,
    fetchFiles,
    uploadFile,
    downloadFile,
    getDownloadUrl,
  }
}
