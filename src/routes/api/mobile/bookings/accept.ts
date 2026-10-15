import { createFileRoute } from '@tanstack/react-router'
import { acceptBooking } from '#/lib/booking-service'

export const Route = createFileRoute('/api/mobile/bookings/accept')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            bookingId: string
            driverId: string
          }

          const result = await acceptBooking(body)

          const status = !result.success ? (result.errors ? 400 : 500) : 200

          return new Response(JSON.stringify(result), {
            status,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Accept booking error:', error)
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
