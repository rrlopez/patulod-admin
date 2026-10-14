import { createFileRoute } from '@tanstack/react-router'
import { db } from '#/db'

interface UserProfileResponse {
  success: boolean
  user?: {
    id: string
    fullName: string
    email: string
    phone: string
    role: string
    isActive: boolean
    createdAt: string
    // Driver-specific fields
    driverStats?: {
      rating: number
      totalTrips: number
      memberSince: string
    }
    vehicleInfo?: {
      vehicleType: string
      plateNumber: string
      vehicleModel: string
      vehicleColor: string
    }
    applicationStatus?: string
  }
  error?: string
}

export const Route = createFileRoute('/api/mobile/user/me')({
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
              } as UserProfileResponse),
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
              } as UserProfileResponse),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          // Lookup PatulodUser
          const patulodUser = await db.patulodUser.findUnique({
            where: { userId: session.userId },
            select: {
              id: true,
              fullName: true,
              phone: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          })

          if (!patulodUser) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'User profile not found',
              } as UserProfileResponse),
              {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const responseData: UserProfileResponse = {
            success: true,
            user: {
              id: patulodUser.id,
              fullName: patulodUser.fullName,
              email: session.user.email,
              phone: patulodUser.phone,
              role: patulodUser.role,
              isActive: patulodUser.isActive,
              createdAt: patulodUser.createdAt.toISOString(),
            },
          }

          // If driver, fetch additional driver-specific data
          if (patulodUser.role === 'DRIVER') {
            // Get driver application
            const driverApplication = await db.driverApplication.findFirst({
              where: {
                email: session.user.email,
              },
              orderBy: {
                submittedAt: 'desc',
              },
            })

            if (driverApplication) {
              responseData.user!.vehicleInfo = {
                vehicleType: driverApplication.vehicleType,
                plateNumber: driverApplication.plateNumber,
                vehicleModel: driverApplication.vehicleModel,
                vehicleColor: driverApplication.vehicleColor,
              }
              responseData.user!.applicationStatus = driverApplication.status
            }

            // TODO: Add real stats from trips table when implemented
            // For now, return placeholder data
            responseData.user!.driverStats = {
              rating: 4.8,
              totalTrips: 0,
              memberSince: new Date(patulodUser.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              }),
            }
          }

          return new Response(
            JSON.stringify(responseData),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ User profile fetch error:', error)

          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to fetch user profile. Please try again.',
            } as UserProfileResponse),
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
