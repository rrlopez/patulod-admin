import { createFileRoute } from '@tanstack/react-router'
import { parsePhoneNumber } from 'libphonenumber-js'
import { db } from '#/db'

interface DriverApplicationRequest {
  fullName: string
  email: string
  phone: string
  vehicleType: string
  plateNumber: string
  vehicleModel: string
  vehicleColor: string
}

interface DriverApplicationResponse {
  success: boolean
  applicationId?: string
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

              // Check for duplicate phone
              const existingPhone = await db.driverApplication.findFirst({
                where: {
                  phone: normalizedPhone,
                  status: { in: ['PENDING', 'APPROVED'] },
                },
              })
              if (existingPhone) {
                errors.phone = 'An application with this phone number already exists'
              }
            }
          } catch (error) {
            errors.phone = 'Invalid phone number format'
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

          // Create driver application
          const application = await db.driverApplication.create({
            data: {
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

          return new Response(
            JSON.stringify({
              success: true,
              applicationId: application.id,
            } as DriverApplicationResponse),
            {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        } catch (error) {
          console.error('❌ Driver application error:', error)
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
