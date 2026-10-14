import { createFileRoute } from '@tanstack/react-router'
import { logoutPassenger } from '#/lib/mobile-auth'

export const Route = createFileRoute('/api/mobile/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const result = await logoutPassenger(request.headers)

        const status = result.success ? 200 : 500

        return new Response(JSON.stringify(result), {
          status,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
    },
  },
})
