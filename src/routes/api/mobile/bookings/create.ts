import { createFileRoute } from '@tanstack/react-router'
import { createBooking } from '#/lib/booking-service'
import type { CreateBookingRequest } from '#/lib/booking-service'

export const Route = createFileRoute('/api/mobile/bookings/create')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as CreateBookingRequest
          const result = await createBooking(body)

          const status = !result.success ? (result.errors ? 400 : 500) : 200

          return new Response(JSON.stringify(result), {
            status,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Create booking error:', error)
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Internal server error',
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )
        }
      },
    },
  },
})
