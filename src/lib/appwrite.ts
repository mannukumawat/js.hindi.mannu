import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite'

// Hardcoded Appwrite credentials.
// endpoint + projectId are public/client-safe (shipped to the browser).
// The secret APPWRITE_API_KEY is NEVER used here — only in scripts/appwrite-setup.mjs (server).
export const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1'
export const APPWRITE_PROJECT_ID = '6a23e1430001821abf6c'
export const APPWRITE_DATABASE_ID = 'peerpizza'

// Collection + bucket IDs (provisioned by `npm run appwrite:setup`)
export const COLLECTIONS = {
  rooms: 'rooms',
  messages: 'messages',
  roomFiles: 'room_files',
  presence: 'presence',
} as const

export const BUCKET_ID = 'room-files'

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

export const appwriteClient = client
export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export { ID, Query, Permission, Role }

// Realtime channel for a whole collection's document events
export function collectionChannel(collectionId: string): string {
  return `databases.${APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`
}

// ===== App-facing types (kept stable so UI components stay unchanged) =====
export interface Room {
  id: string
  room_code: string
  created_by: string | null
  is_permanent: boolean
  created_at: string
  expires_at: string | null
}

export interface Message {
  id: string
  room_id: string
  user_id: string | null
  guest_name: string | null
  content: string
  created_at: string
}

export interface RoomFile {
  id: string
  room_id: string
  file_name: string
  file_size: number
  storage_path: string
  uploaded_by: string | null
  guest_name: string | null
  created_at: string
}

// ===== Mappers: Appwrite document -> app shape =====
// $id and $createdAt are Appwrite system fields; the rest are our attributes.
type Doc = Record<string, any>

export function mapRoom(d: Doc): Room {
  return {
    id: d.$id,
    room_code: d.room_code,
    created_by: d.created_by ?? null,
    is_permanent: !!d.is_permanent,
    created_at: d.$createdAt,
    expires_at: d.expires_at ?? null,
  }
}

export function mapMessage(d: Doc): Message {
  return {
    id: d.$id,
    room_id: d.room_id,
    user_id: d.user_id ?? null,
    guest_name: d.guest_name ?? null,
    content: d.content,
    created_at: d.$createdAt,
  }
}

export function mapFile(d: Doc): RoomFile {
  return {
    id: d.$id,
    room_id: d.room_id,
    file_name: d.file_name,
    file_size: d.file_size,
    storage_path: d.storage_path,
    uploaded_by: d.uploaded_by ?? null,
    guest_name: d.guest_name ?? null,
    created_at: d.$createdAt,
  }
}
