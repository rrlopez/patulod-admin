import { createFileRoute } from '@tanstack/react-router'
import { getActiveBooking } from '#/lib/booking-service'

export const Route = createFileRoute('/api/mobile/bookings/active')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const userId = url.searchParams.get('userId')

          if (!userId) {
            return new Response(
              JSON.stringify({
                success: false,
                errors: { userId: 'User ID is required' },
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            )
          }

          const result = await getActiveBooking(userId)

          return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 404,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Get active booking error:', error)
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
