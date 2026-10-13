import { PrismaClient } from '../prisma/generated/client/client.js'

import { getDatabaseUrl } from './database-url.js'

import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

declare global {
  var __prisma: PrismaClient | undefined
}

export const db = globalThis.__prisma || new PrismaClient({ adapter })
export const prisma = db // Alias for backwards compatibility

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db
}

