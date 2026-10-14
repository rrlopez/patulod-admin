/**
 * Typed client helper for POST /api/prisma
 * Use this in the admin UI (cookie session is sent automatically by the browser).
 */

type PrismaOperation =
  | 'findMany'
  | 'findUnique'
  | 'findFirst'
  | 'create'
  | 'update'
  | 'delete'
  | 'count'
  | 'upsert'
  | 'aggregate'
  | 'groupBy'

interface PrismaQueryOptions {
  model: string
  operation: PrismaOperation
  args?: Record<string, unknown>
}

interface PrismaResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: unknown
}

export async function prismaQuery<T = unknown>(
  options: PrismaQueryOptions,
): Promise<T> {
  const res = await fetch('/api/prisma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // send cookie session
    body: JSON.stringify(options),
  })

  const json: PrismaResponse<T> = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`)
  }

  return json.data as T
}
