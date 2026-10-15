import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '../db'

// Verify the secret is loaded
const authSecret = process.env.BETTER_AUTH_SECRET || 'dev-secret-please-change-in-production'
console.log('🔐 Better Auth initializing with secret:', authSecret ? '✅ SET' : '❌ NOT SET')
console.log('🔐 Secret preview:', authSecret.substring(0, 10) + '...')

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
    autoSignIn: true, // Auto sign in after registration
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret: authSecret,
  plugins: [tanstackStartCookies()],
  advanced: {
    generateId: false, // Use Prisma's default ID generation
  },
})

export type Session = typeof auth.$Infer.Session

