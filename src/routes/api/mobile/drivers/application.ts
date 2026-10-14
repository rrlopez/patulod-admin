import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db'

interface ApplicationResponse {
  success: boolean
  application?: {
    id: string
    status: string
    submittedAt: string
    documents: Array<{
      id: string
      documentType: string
      reviewStatus: string
      uploadedAt: string
      rejectionReason?: string
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
              } as ApplicationResponse),
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
              } as ApplicationResponse),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Lookup PatulodUser to verify role
          const patulodUser = await db.patulodUser.findUnique({
            where: { userId: session.userId },
            select: { id: true, role: true },
          })

          if (!patulodUser || patulodUser.role !== 'DRIVER') {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Access denied. Only drivers can access their application.',
              } as ApplicationResponse),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Find DriverApplication by email (from Better Auth user)
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
                  uploadedAt: true,
                  rejectionReason: true,
                },
                orderBy: {
                  uploadedAt: 'desc',
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          })

          if (!application) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'No driver application found',
              } as ApplicationResponse),
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
                submittedAt: application.submittedAt.toISOString(),
                documents: application.documents.map((doc) => ({
                  id: doc.id,
                  documentType: doc.documentType,
                  reviewStatus: doc.reviewStatus,
                  uploadedAt: doc.uploadedAt.toISOString(),
                  rejectionReason: doc.rejectionReason || undefined,
                })),
              },
            } as ApplicationResponse),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ Get application error:', error)

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to retrieve application. Please try again.',
            } as ApplicationResponse),
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
