import { createFileRoute } from '@tanstack/react-router'
import { registerPassenger } from '#/lib/mobile-auth'
import type { RegisterRequest } from '#/lib/mobile-auth'

export const Route = createFileRoute('/api/mobile/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as RegisterRequest
        const result = await registerPassenger(body)

        const status = !result.success ? (result.errors ? 400 : 500) : 200

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
