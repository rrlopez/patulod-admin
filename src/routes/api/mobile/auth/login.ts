import { createFileRoute } from '@tanstack/react-router'
import { loginPassenger } from '#/lib/mobile-auth'
import type { LoginRequest } from '#/lib/mobile-auth'

export const Route = createFileRoute('/api/mobile/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as LoginRequest
        const result = await loginPassenger(body)

        const status = result.success ? 200 : 401

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
