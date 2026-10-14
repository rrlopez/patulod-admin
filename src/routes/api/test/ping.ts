import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/test/ping')({
  server: {
    handlers: {
      GET: async () => {
        console.log('✅ Ping endpoint hit!', new Date().toISOString())
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Backend is reachable!',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      },
    },
  },
})
