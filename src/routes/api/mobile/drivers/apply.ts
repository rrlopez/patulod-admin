import { createFileRoute } from '@tanstack/react-router'
import { parsePhoneNumber } from 'libphonenumber-js'
import { db } from '#/db'
import { auth } from '#/lib/auth'

interface DriverApplicationRequest {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  vehicleType: string
  plateNumber: string
  vehicleModel: string
  vehicleColor: string
}

interface DriverApplicationResponse {
  success: boolean
  applicationId?: string
  user?: {
    id: string
    fullName: string
    email: string
    role: string
  }
  session?: {
    token: string
    expiresAt: string
  }
  error?: string
  errors?: Record<string, string>
}

export const Route = createFileRoute('/api/mobile/drivers/apply')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as DriverApplicationRequest

          // Validation
          const errors: Record<string, string> = {}

          // Validate full name
          if (!body.fullName || body.fullName.trim().length < 2) {
            errors.fullName = 'Full name must be at least 2 characters'
          }
          if (body.fullName && !/^[a-zA-ZÀ-ÿ\s'\-]+$/.test(body.fullName)) {
            errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes'
          }

          // Validate email
          if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
            errors.email = 'Invalid email address'
          }

          // Check for duplicate email in applications
          if (body.email) {
            const existingApp = await db.driverApplication.findFirst({
              where: {
                email: body.email.toLowerCase(),
                status: { in: ['PENDING', 'APPROVED'] },
              },
            })
            if (existingApp) {
              errors.email = 'An application with this email already exists'
            }
          }

          // Validate phone (PH format)
          let normalizedPhone = body.phone
          try {
            const phoneNumber = parsePhoneNumber(body.phone, 'PH')
            if (!phoneNumber.isValid()) {
              errors.phone = 'Invalid Philippine phone number'
            } else {
              normalizedPhone = phoneNumber.number

              // Check for duplicate phone in PatulodUser (both passengers and drivers)
              const existingPhone = await db.patulodUser.findUnique({
                where: { phone: normalizedPhone },
              })
              if (existingPhone) {
                errors.phone = 'This phone number is already registered'
              }
            }
          } catch (error) {
            errors.phone = 'Invalid phone number format'
          }

          // Validate password
          if (!body.password || body.password.length < 8) {
            errors.password = 'Password must be at least 8 characters'
          }
          if (body.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(body.password)) {
            errors.password = 'Password must contain uppercase, lowercase, and number'
          }
          if (body.password !== body.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match'
          }

          // Validate vehicle type
          if (!body.vehicleType || !['motorcycle', 'tricycle'].includes(body.vehicleType)) {
            errors.vehicleType = 'Please select a valid vehicle type'
          }

          // Validate plate number
          if (!body.plateNumber || body.plateNumber.trim().length < 4) {
            errors.plateNumber = 'Please enter a valid plate number'
          }

          // Check for duplicate plate number
          if (body.plateNumber) {
            const existingPlate = await db.driverApplication.findFirst({
              where: {
                plateNumber: body.plateNumber.toUpperCase().trim(),
                status: { in: ['PENDING', 'APPROVED'] },
              },
            })
            if (existingPlate) {
              errors.plateNumber = 'This plate number is already registered'
            }
          }

          // Validate vehicle model
          if (!body.vehicleModel || body.vehicleModel.trim().length < 2) {
            errors.vehicleModel = 'Please enter a valid vehicle model'
          }

          // Validate vehicle color
          if (!body.vehicleColor || body.vehicleColor.trim().length < 2) {
            errors.vehicleColor = 'Please enter a valid vehicle color'
          }

          // Return validation errors
          if (Object.keys(errors).length > 0) {
            return new Response(JSON.stringify({ success: false, errors }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Create Better Auth user with DRIVER role (PENDING status)
          const signUpResult = await auth.api.signUpEmail({
            body: {
              email: body.email.toLowerCase(),
              password: body.password,
              name: body.fullName,
            },
            asResponse: false,
          })

          if (!signUpResult) {
            console.error('Better Auth signUp returned null/undefined')
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to create account' }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          console.log('✅ Better Auth driver user created:', signUpResult.user.id)

          // Extract session token
          let token: string
          let expiresAt: Date

          if (signUpResult.token) {
            token = signUpResult.token
            
            const sessionData = await db.session.findFirst({
              where: { userId: signUpResult.user.id },
              orderBy: { createdAt: 'desc' },
              select: { expiresAt: true },
            })
            
            if (!sessionData) {
              console.error('❌ Session data not found for user:', signUpResult.user.id)
              return new Response(
                JSON.stringify({ success: false, error: 'Account created but session could not be established. Please log in.' }),
                {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }
            
            expiresAt = sessionData.expiresAt
          } else {
            const sessionData = await db.session.findFirst({
              where: { userId: signUpResult.user.id },
              orderBy: { createdAt: 'desc' },
              select: { token: true, expiresAt: true },
            })

            if (!sessionData?.token) {
              console.error('❌ Session token not found for user:', signUpResult.user.id)
              return new Response(
                JSON.stringify({ success: false, error: 'Account created but session could not be established. Please log in.' }),
                {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }

            token = sessionData.token
            expiresAt = sessionData.expiresAt
          }

          // Create PatulodUser record with DRIVER role
          const patulodUser = await db.patulodUser.create({
            data: {
              fullName: body.fullName.trim(),
              phone: normalizedPhone,
              userId: signUpResult.user.id,
              role: 'DRIVER',
              isActive: true, // Active from the start - they can log in to check status
            },
          })

          console.log('✅ PatulodUser (DRIVER) created with ID:', patulodUser.id)

          // Create driver application
          const application = await db.driverApplication.create({
            data: {
              userId: patulodUser.id,
              fullName: body.fullName.trim(),
              email: body.email.toLowerCase().trim(),
              phone: normalizedPhone,
              vehicleType: body.vehicleType,
              plateNumber: body.plateNumber.toUpperCase().trim(),
              vehicleModel: body.vehicleModel.trim(),
              vehicleColor: body.vehicleColor.trim(),
              status: 'PENDING',
            },
          })

          console.log('✅ Driver application created:', application.id)

          // Create audit log
          await db.auditLog.create({
            data: {
              userId: patulodUser.id,
              entity: 'DriverApplication',
              action: 'APPLY',
              actorId: patulodUser.id,
              actorRole: 'DRIVER',
              metadata: {
                email: body.email,
                phone: normalizedPhone,
                vehicleType: body.vehicleType,
                plateNumber: body.plateNumber,
              },
            },
          })

          return new Response(
            JSON.stringify({
              success: true,
              applicationId: application.id,
              user: {
                id: signUpResult.user.id,
                fullName: body.fullName,
                email: signUpResult.user.email,
                role: 'DRIVER',
              },
              session: {
                token,
                expiresAt: expiresAt.toISOString(),
              },
            } as DriverApplicationResponse),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ Driver application error:', error)
          
          // Handle Better Auth errors
          if (error && typeof error === 'object' && 'body' in error) {
            const authError = error as { body?: { message?: string; code?: string } }
            if (authError.body?.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
              return new Response(
                JSON.stringify({
                  success: false,
                  errors: { email: 'This email is already registered' },
                } as DriverApplicationResponse),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                },
              )
            }
          }
          
          // Handle Prisma unique constraint errors
          if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as { code?: string; meta?: { target?: string[] } }
            if (prismaError.code === 'P2002') {
              const target = prismaError.meta?.target?.[0]
              if (target === 'phone') {
                return new Response(
                  JSON.stringify({
                    success: false,
                    errors: { phone: 'This phone number is already registered' },
                  } as DriverApplicationResponse),
                  {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                  },
                )
              }
            }
          }
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Failed to submit application. Please try again.',
            } as DriverApplicationResponse),
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
