import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const UPLOADS_DIR = '.uploads'
const BUCKET_NAME = 'driver-documents'

let supabaseClient: ReturnType<typeof createClient> | null = null

// Initialize Supabase client if credentials are available
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  console.log('✅ Storage: Using Supabase for file uploads')
} else {
  console.warn(
    '⚠️  Storage: Supabase credentials not found (SUPABASE_URL, SUPABASE_SERVICE_KEY). Using local fallback (.uploads/ directory)',
  )
}

async function uploadToSupabase(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<string> {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized')
  }

  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(filename, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    console.error('❌ Supabase upload error:', error)
    throw new Error(`Failed to upload to Supabase: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabaseClient.storage.from(BUCKET_NAME).getPublicUrl(data.path)

  return publicUrl
}

async function uploadToLocal(fileBuffer: Buffer, filename: string): Promise<string> {
  try {
    // Ensure .uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true })

    const filePath = join(UPLOADS_DIR, filename)
    await writeFile(filePath, fileBuffer)

    // Return relative path as URL (frontend will handle this appropriately)
    return `/uploads/${filename}`
  } catch (error) {
    console.error('❌ Local upload error:', error)
    throw new Error('Failed to save file locally')
  }
}

/**
 * Upload a file to storage (Supabase or local fallback)
 * @param fileBuffer - The file data as a Buffer
 * @param filename - The original filename
 * @param mimeType - The MIME type of the file
 * @param applicationId - The driver application ID (for organizing files)
 * @param documentType - The type of document being uploaded
 * @returns The public URL or local path of the uploaded file
 */
export async function uploadFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  applicationId: string,
  documentType: string,
): Promise<string> {
  // Create a unique filename with application ID and document type
  const timestamp = Date.now()
  const extension = filename.split('.').pop()
  const uniqueFilename = `${applicationId}/${documentType}_${timestamp}.${extension}`

  if (supabaseClient) {
    return await uploadToSupabase(fileBuffer, uniqueFilename, mimeType)
  } else {
    return await uploadToLocal(fileBuffer, uniqueFilename.replace(/\//g, '_'))
  }
}
