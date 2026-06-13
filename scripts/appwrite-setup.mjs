/**
 * Appwrite provisioning script — run once: `npm run appwrite:setup`
 *
 * Creates (idempotently) the database collections + storage bucket the app needs:
 *   collections: rooms, messages, room_files, presence
 *   bucket:      room-files
 *
 * Reads credentials from .env.local (APPWRITE_ENDPOINT / PROJECT_ID / DATABASE_ID / API_KEY).
 * The API key is a SECRET — keep it server-side only (this script never ships to the browser).
 */
import { config as loadEnv } from 'dotenv'
import {
  Client,
  Databases,
  Storage,
  Permission,
  Role,
  IndexType,
} from 'node-appwrite'

loadEnv({ path: '.env.local' })

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a23e1430001821abf6c'
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'peerpizza'
const API_KEY = process.env.APPWRITE_API_KEY

if (!API_KEY) {
  console.error('✗ Missing APPWRITE_API_KEY in .env.local')
  process.exit(1)
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const databases = new Databases(client)
const storage = new Storage(client)

const BUCKET_ID = 'room-files'
const MAX_FILE_SIZE = 50_000_000 // 50MB — Appwrite Cloud per-file cap on this plan

// Open CRUD for everyone (matches the app's permissive model — guests can use rooms)
const ANY_CRUD = [
  Permission.read(Role.any()),
  Permission.create(Role.any()),
  Permission.update(Role.any()),
  Permission.delete(Role.any()),
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Run a step, treating 409 (already exists) as success so re-runs are safe.
async function step(label, fn) {
  try {
    await fn()
    console.log('  ✓', label)
  } catch (e) {
    if (e?.code === 409) {
      console.log('  • already exists:', label)
    } else {
      console.error('  ✗', label, '—', e?.message || e)
      throw e
    }
  }
}

// Appwrite creates attributes asynchronously; indexes need them "available" first.
async function waitForAttributes(collectionId) {
  for (let i = 0; i < 30; i++) {
    const col = await databases.getCollection(DATABASE_ID, collectionId)
    const attrs = col.attributes || []
    if (attrs.length > 0 && attrs.every((a) => a.status === 'available')) return
    await sleep(1000)
  }
  console.warn('  ! attributes still processing for', collectionId, '(indexes may need a re-run)')
}

async function ensureDatabase() {
  console.log('Database:')
  // Pre-check: free plans cap database count, so re-creating an existing one errors
  // with a plan-limit message instead of a clean 409. Skip create if it already exists.
  try {
    await databases.get(DATABASE_ID)
    console.log('  • already exists: database', DATABASE_ID)
    return
  } catch (e) {
    if (e?.code && e.code !== 404) {
      console.log('  ! could not read database (', e.message, ') — attempting create')
    }
  }
  await step(`database ${DATABASE_ID}`, () => databases.create(DATABASE_ID, 'peerpizza'))
}

async function ensureCollection(id, name, attributes, indexes) {
  console.log(`Collection: ${id}`)
  await step(`collection ${id}`, () =>
    databases.createCollection(DATABASE_ID, id, name, ANY_CRUD, false),
  )

  // Read what already exists so re-runs skip creates entirely (avoids plan
  // size-limit errors that fire on re-creating existing large attributes).
  let existingAttrs = new Set()
  let existingIdx = new Set()
  try {
    const col = await databases.getCollection(DATABASE_ID, id)
    existingAttrs = new Set((col.attributes || []).map((a) => a.key))
    existingIdx = new Set((col.indexes || []).map((i) => i.key))
  } catch {
    /* fresh collection — nothing exists yet */
  }

  for (const a of attributes) {
    if (existingAttrs.has(a.key)) {
      console.log('  • already exists: attr', `${id}.${a.key}`)
      continue
    }
    await step(`attr ${id}.${a.key}`, () => a.create())
  }

  await waitForAttributes(id)

  for (const ix of indexes) {
    if (existingIdx.has(ix.key)) {
      console.log('  • already exists: index', `${id}.${ix.key}`)
      continue
    }
    await step(`index ${id}.${ix.key}`, () =>
      databases.createIndex(DATABASE_ID, id, ix.key, ix.type, ix.attributes),
    )
  }
}

async function ensureBucket() {
  console.log('Bucket:')
  await step(`bucket ${BUCKET_ID}`, () =>
    storage.createBucket(
      BUCKET_ID,
      'room-files',
      ANY_CRUD,
      false, // fileSecurity (use bucket-level perms)
      true, // enabled
      MAX_FILE_SIZE,
    ),
  )
}

async function main() {
  console.log(`\nProvisioning Appwrite @ ${ENDPOINT}\n  project=${PROJECT_ID} database=${DATABASE_ID}\n`)

  await ensureDatabase()

  // rooms
  await ensureCollection(
    'rooms',
    'rooms',
    [
      { key: 'room_code', create: () => databases.createStringAttribute(DATABASE_ID, 'rooms', 'room_code', 64, true) },
      { key: 'created_by', create: () => databases.createStringAttribute(DATABASE_ID, 'rooms', 'created_by', 255, false) },
      { key: 'is_permanent', create: () => databases.createBooleanAttribute(DATABASE_ID, 'rooms', 'is_permanent', false, false) },
      { key: 'expires_at', create: () => databases.createDatetimeAttribute(DATABASE_ID, 'rooms', 'expires_at', false) },
    ],
    [
      { key: 'idx_room_code', type: IndexType.Unique, attributes: ['room_code'] },
      { key: 'idx_created_by', type: IndexType.Key, attributes: ['created_by'] },
    ],
  )

  // messages
  await ensureCollection(
    'messages',
    'messages',
    [
      { key: 'room_id', create: () => databases.createStringAttribute(DATABASE_ID, 'messages', 'room_id', 64, true) },
      { key: 'user_id', create: () => databases.createStringAttribute(DATABASE_ID, 'messages', 'user_id', 255, false) },
      { key: 'guest_name', create: () => databases.createStringAttribute(DATABASE_ID, 'messages', 'guest_name', 128, false) },
      { key: 'content', create: () => databases.createStringAttribute(DATABASE_ID, 'messages', 'content', 8192, true) },
    ],
    [{ key: 'idx_room_id', type: IndexType.Key, attributes: ['room_id'] }],
  )

  // room_files
  await ensureCollection(
    'room_files',
    'room_files',
    [
      { key: 'room_id', create: () => databases.createStringAttribute(DATABASE_ID, 'room_files', 'room_id', 64, true) },
      { key: 'file_name', create: () => databases.createStringAttribute(DATABASE_ID, 'room_files', 'file_name', 512, true) },
      { key: 'file_size', create: () => databases.createIntegerAttribute(DATABASE_ID, 'room_files', 'file_size', true, 0) },
      { key: 'storage_path', create: () => databases.createStringAttribute(DATABASE_ID, 'room_files', 'storage_path', 1024, true) },
      { key: 'uploaded_by', create: () => databases.createStringAttribute(DATABASE_ID, 'room_files', 'uploaded_by', 255, false) },
      { key: 'guest_name', create: () => databases.createStringAttribute(DATABASE_ID, 'room_files', 'guest_name', 128, false) },
    ],
    [{ key: 'idx_room_id', type: IndexType.Key, attributes: ['room_id'] }],
  )

  // presence (online-users + typing; last_seen tracked via system $updatedAt)
  await ensureCollection(
    'presence',
    'presence',
    [
      { key: 'room_id', create: () => databases.createStringAttribute(DATABASE_ID, 'presence', 'room_id', 64, true) },
      { key: 'name', create: () => databases.createStringAttribute(DATABASE_ID, 'presence', 'name', 128, true) },
      { key: 'is_typing', create: () => databases.createBooleanAttribute(DATABASE_ID, 'presence', 'is_typing', false, false) },
    ],
    [{ key: 'idx_room_id', type: IndexType.Key, attributes: ['room_id'] }],
  )

  await ensureBucket()

  console.log('\n✓ Done. Collections + bucket ready.\n')
}

main().catch((e) => {
  console.error('\nSetup failed:', e?.message || e)
  process.exit(1)
})
