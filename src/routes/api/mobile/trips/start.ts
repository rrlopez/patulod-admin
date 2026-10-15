import { createFileRoute } from '@tanstack/react-router'
import { startTrip } from '#/lib/trip-service'

export const Route = createFileRoute('/api/mobile/trips/start')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            tripId: string
            driverId: string
          }

          const result = await startTrip(body)

          const status = !result.success ? (result.errors ? 400 : 500) : 200

          return new Response(JSON.stringify(result), {
            status,
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Start trip error:', error)
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
