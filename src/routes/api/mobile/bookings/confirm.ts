import { createFileRoute } from '@tanstack/react-router'
import { confirmBooking } from '#/lib/booking-service'

export const Route = createFileRoute('/api/mobile/bookings/confirm')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { bookingId: string; userId: string }
          const result = await confirmBooking(body)

          const status = !result.success ? (result.errors ? 400 : 500) : 200

          return new Response(JSON.stringify(result), {
            status,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Confirm booking error:', error)
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
