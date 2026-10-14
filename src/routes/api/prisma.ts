import { createFileRoute } from '@tanstack/react-router'
import { handlePrismaRequest } from '#/lib/prisma-endpoint'

export const Route = createFileRoute('/api/prisma')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        return handlePrismaRequest(request)
      },
    },
  },
})
