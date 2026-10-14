import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db'

interface ApplicationStatusResponse {
  success: boolean
  application?: {
    id: string
    status: string
    fullName: string
    email: string
    phone: string
    vehicleType: string
    plateNumber: string
    vehicleModel: string
    vehicleColor: string
    submittedAt: string
    reviewedAt?: string
    rejectionReason?: string
    notes?: string
    documents: Array<{
      id: string
      documentType: string
      reviewStatus: string
      rejectionReason?: string
      uploadedAt: string
    }>
  }
  error?: string
}

export const Route = createFileRoute('/api/mobile/drivers/application')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          // Extract Bearer token from Authorization header
          const authHeader = request.headers.get('Authorization')
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Missing or invalid Authorization header',
              } as ApplicationStatusResponse),
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
              } as ApplicationStatusResponse),
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
                error: 'Access denied. Only drivers can view application status.',
              } as ApplicationStatusResponse),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Find driver application by email (using the Better Auth user email)
          const application = await db.driverApplication.findFirst({
            where: {
              email: session.user.email,
            },
            include: {
              documents: {
                select: {
                  id: true,
                  documentType: true,
                  reviewStatus: true,
                  rejectionReason: true,
                  uploadedAt: true,
                },
                orderBy: {
                  uploadedAt: 'asc',
                },
              },
            },
            orderBy: {
              submittedAt: 'desc',
            },
          })

          if (!application) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'No driver application found',
              } as ApplicationStatusResponse),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              application: {
                id: application.id,
                status: application.status,
                fullName: application.fullName,
                email: application.email,
                phone: application.phone,
                vehicleType: application.vehicleType,
                plateNumber: application.plateNumber,
                vehicleModel: application.vehicleModel,
                vehicleColor: application.vehicleColor,
                submittedAt: application.submittedAt.toISOString(),
                reviewedAt: application.reviewedAt?.toISOString(),
                rejectionReason: application.rejectionReason || undefined,
                notes: application.notes || undefined,
                documents: application.documents.map((doc) => ({
                  id: doc.id,
                  documentType: doc.documentType,
                  reviewStatus: doc.reviewStatus,
                  rejectionReason: doc.rejectionReason || undefined,
                  uploadedAt: doc.uploadedAt.toISOString(),
                })),
              },
            } as ApplicationStatusResponse),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ Application status fetch error:', error)

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to fetch application status. Please try again.',
            } as ApplicationStatusResponse),
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
