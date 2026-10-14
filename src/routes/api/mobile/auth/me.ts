import { createFileRoute } from '@tanstack/react-router'
import { getCurrentUser } from '#/lib/mobile-auth'

export const Route = createFileRoute('/api/mobile/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const result = await getCurrentUser(request.headers)

        const status = !result.success 
          ? (result.error === 'Not authenticated' ? 401 : 500)
          : 200

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
