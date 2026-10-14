import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db'

interface UploadDocumentResponse {
  success: boolean
  documentId?: string
  uploadedUrl?: string
  error?: string
}

const VALID_DOCUMENT_TYPES = [
  'DRIVERS_LICENSE_FRONT',
  'DRIVERS_LICENSE_BACK',
  'VEHICLE_OR_CR',
  'GOVERNMENT_ID',
  'VEHICLE_PHOTO_FRONT',
  'VEHICLE_PHOTO_SIDE',
  'VEHICLE_PHOTO_PLATE',
]

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB limit for database storage

export const Route = createFileRoute('/api/mobile/drivers/upload-document')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Extract Bearer token from Authorization header
          const authHeader = request.headers.get('Authorization')
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Missing or invalid Authorization header',
              } as UploadDocumentResponse),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const token = authHeader.substring(7) // Remove 'Bearer ' prefix

          // Query session by token
          const session = await db.session.findUnique({
            where: { token },
            include: { user: true },
          })

          if (!session) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Invalid or expired session',
              } as UploadDocumentResponse),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Lookup PatulodUser to verify role
          const patulodUser = await db.patulodUser.findUnique({
            where: { userId: session.userId },
            select: { id: true, role: true, fullName: true },
          })

          if (!patulodUser || patulodUser.role !== 'DRIVER') {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Access denied. Only drivers can upload documents.',
              } as UploadDocumentResponse),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Parse multipart form data
          const formData = await request.formData()

          // Extract fields
          const file = formData.get('file') as File | null
          const applicationId = formData.get('applicationId') as string | null
          const documentType = formData.get('documentType') as string | null

          // Validation
          if (!file) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'File is required',
              } as UploadDocumentResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          if (!applicationId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Application ID is required',
              } as UploadDocumentResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: `Invalid document type. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`,
              } as UploadDocumentResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'File size exceeds 5MB limit',
              } as UploadDocumentResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Validate MIME type
          if (!VALID_MIME_TYPES.includes(file.type)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
              } as UploadDocumentResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Verify application exists
          const application = await db.driverApplication.findUnique({
            where: { id: applicationId },
          })

          if (!application) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Driver application not found',
              } as UploadDocumentResponse),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Read file as Buffer and convert to base64
          const buffer = Buffer.from(await file.arrayBuffer())
          const base64Data = buffer.toString('base64')

          // Upsert DriverDocument record with base64 data
          const existingDocument = await db.driverDocument.findFirst({
            where: {
              driverApplicationId: applicationId,
              documentType: documentType,
            },
          })

          let document
          if (existingDocument) {
            // Update existing document
            document = await db.driverDocument.update({
              where: { id: existingDocument.id },
              data: {
                fileData: base64Data,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                uploadedAt: new Date(),
                reviewStatus: 'PENDING', // Reset review status on re-upload
                rejectionReason: null,
              },
            })
          } else {
            // Create new document
            document = await db.driverDocument.create({
              data: {
                driverApplicationId: applicationId,
                documentType: documentType,
                fileData: base64Data,
                fileName: file.name,
                mimeType: file.type,
                fileSize: file.size,
                reviewStatus: 'PENDING',
              },
            })
          }

          // Create audit log
          await db.auditLog.create({
            data: {
              userId: patulodUser.id,
              entity: 'DriverDocument',
              action: existingDocument ? 'UPDATE' : 'CREATE',
              actorId: patulodUser.id,
              actorRole: 'DRIVER',
              metadata: {
                documentId: document.id,
                documentType: documentType,
                applicationId: applicationId,
                fileName: file.name,
                fileSize: file.size,
              },
            },
          })

          console.log('✅ Document uploaded:', {
            documentId: document.id,
            documentType,
            applicationId,
            uploadedBy: patulodUser.fullName,
            fileSize: file.size,
          })

          // Return data URL for preview (base64)
          const dataUrl = `data:${document.mimeType};base64,${document.fileData}`

          return new Response(
            JSON.stringify({
              success: true,
              documentId: document.id,
              uploadedUrl: dataUrl, // Return base64 data URL for preview
            } as UploadDocumentResponse),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ Document upload error:', error)

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to upload document. Please try again.',
            } as UploadDocumentResponse),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
