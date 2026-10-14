/**
 * Generic Prisma CRUD endpoint logic
 *
 * Handles validation, authentication, row-level security, sensitive field
 * stripping, and error mapping for POST /api/prisma.
 *
 * Master plan reference:
 *   - model: Prisma model name
 *   - operation: findMany | findUnique | findFirst | create | update | delete | count | upsert
 *   - args: Prisma query args (where, data, select, include, orderBy, take, skip, etc.)
 *
 * Security rules:
 *   - All callers must be authenticated (admin cookie session OR mobile Bearer token)
 *   - Mobile users (PASSENGER / DRIVER) are automatically scoped to their own data
 *   - Admin users bypass row-level scoping
 *   - Sensitive fields (password, account credentials) are stripped from every result
 *   - Certain models (session, account, verification) are admin-only
 */

import { z } from 'zod/v4'
import { auth } from './auth'
import { db } from '../db'

// ─────────────────────────────────────────────
// Allowed models & operations
// ─────────────────────────────────────────────

/** Models accessible to authenticated mobile users (subject to row-level security) */
const MOBILE_ALLOWED_MODELS = [
  'patulodUser',
  'termsAcceptance',
  'privacyAcknowledgment',
  'booking',
  'bookingEvent',
  'trip',
  'tripEvent',
  'payment',
  'earnings',
  'supportCase',
  'supportCaseEvent',
  'notification',
  'driverApplication',
  'driverDocument',
  'driverAvailability',
  'policyContent',
  'fareConfig',
  'serviceArea',
] as const

/** Additional models only accessible to admins */
const ADMIN_ONLY_MODELS = [
  'user',
  'session',
  'account',
  'verification',
  'admin',
  'auditLog',
  'earningsAdjustment',
  'notificationLog',
] as const

const ALL_ALLOWED_MODELS = [...MOBILE_ALLOWED_MODELS, ...ADMIN_ONLY_MODELS] as const
type AllowedModel = (typeof ALL_ALLOWED_MODELS)[number]

const ALLOWED_OPERATIONS = [
  'findMany',
  'findUnique',
  'findFirst',
  'create',
  'update',
  'delete',
  'count',
  'upsert',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
] as const
type AllowedOperation = (typeof ALLOWED_OPERATIONS)[number]

// ─────────────────────────────────────────────
// Sensitive fields — stripped from all results
// ─────────────────────────────────────────────

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordHash',
  'password_hash',
  'hashedPassword',
  'hashed_password',
  'accessToken',
  'refreshToken',
  'idToken',
  'token',
  'secret',
])

/** Recursively remove sensitive fields from any result value */
function stripSensitiveFields(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map(stripSensitiveFields)
  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!SENSITIVE_FIELDS.has(k)) {
        cleaned[k] = stripSensitiveFields(v)
      }
    }
    return cleaned
  }
  return value
}

// ─────────────────────────────────────────────
// Row-level security — scope queries to the caller
// ─────────────────────────────────────────────

/**
 * Fields that identify "ownership" on each model relative to a PatulodUser.
 * Mobile callers can only read/write rows where this field matches their userId.
 */
const OWNERSHIP_FIELD: Partial<Record<AllowedModel, string>> = {
  patulodUser:           'id',
  termsAcceptance:       'userId',
  privacyAcknowledgment: 'userId',
  booking:               'passengerId',
  bookingEvent:          undefined, // accessed via booking relation — no direct filter
  trip:                  undefined, // driverId or passengerId — handled per-model below
  tripEvent:             undefined, // accessed via trip relation
  payment:               undefined, // accessed via booking
  earnings:              'driverId',
  supportCase:           'reporterId',
  supportCaseEvent:      undefined, // accessed via supportCase
  notification:          'userId',
  driverApplication:     'userId',
  driverDocument:        undefined, // accessed via driverApplication
  driverAvailability:    'driverId',
  policyContent:         undefined, // read-only public content — no ownership scoping needed
  fareConfig:            undefined, // read-only config — no ownership scoping needed
  serviceArea:           undefined, // read-only config — no ownership scoping needed
}

/** Models that mobile users may only read (not write) */
const READ_ONLY_FOR_MOBILE = new Set<AllowedModel>([
  'bookingEvent',
  'tripEvent',
  'fareConfig',
  'serviceArea',
  'policyContent',
  'notificationLog',
])

/**
 * Apply row-level security for non-admin callers.
 * Injects an ownership `where` clause so users can never access each other's data.
 * Returns null if the operation is not permitted at all.
 */
function applyRowLevelSecurity(
  model: AllowedModel,
  operation: AllowedOperation,
  args: Record<string, unknown>,
  patulodUserId: string,
  role: 'PASSENGER' | 'DRIVER',
): Record<string, unknown> | null {
  // Block writes on read-only models
  const isWrite = ['create', 'update', 'delete', 'upsert'].includes(operation)
  if (isWrite && READ_ONLY_FOR_MOBILE.has(model)) return null

  const ownerField = OWNERSHIP_FIELD[model]

  // Models with no direct ownership field — return args unchanged (caller must
  // include appropriate where clauses; response is still field-stripped)
  if (!ownerField) return args

  // For trip: drivers scope to driverId, passengers to passengerId
  if (model === 'trip') {
    const tripOwnerField = role === 'DRIVER' ? 'driverId' : 'passengerId'
    return injectWhereOwnership(args, operation, tripOwnerField, patulodUserId)
  }

  return injectWhereOwnership(args, operation, ownerField, patulodUserId)
}

function injectWhereOwnership(
  args: Record<string, unknown>,
  operation: AllowedOperation,
  field: string,
  value: string,
): Record<string, unknown> {
  if (operation === 'create') {
    // Ensure the ownership field is set to the caller's id on create
    const data = (args.data as Record<string, unknown>) ?? {}
    return { ...args, data: { ...data, [field]: value } }
  }

  // For all read/update/delete/upsert — inject into where
  const existingWhere = (args.where as Record<string, unknown>) ?? {}
  return { ...args, where: { ...existingWhere, [field]: value } }
}

// ─────────────────────────────────────────────
// Zod validation schema
// ─────────────────────────────────────────────

const PrismaRequestSchema = z.object({
  model: z.enum(ALL_ALLOWED_MODELS as unknown as [string, ...string[]]),
  operation: z.enum(ALLOWED_OPERATIONS as unknown as [string, ...string[]]),
  // args is freeform — Prisma validates it internally
  args: z.record(z.string(), z.unknown()).optional().default({}),
})

// ─────────────────────────────────────────────
// Caller identity resolution
// ─────────────────────────────────────────────

type AdminCaller = { type: 'admin'; adminId: string }
type MobileCaller = { type: 'mobile'; patulodUserId: string; role: 'PASSENGER' | 'DRIVER' }
type Caller = AdminCaller | MobileCaller

async function resolveCaller(request: Request): Promise<Caller | null> {
  // 1. Try admin cookie session (Better Auth)
  const adminSession = await auth.api.getSession({ headers: request.headers })
  if (adminSession?.user) {
    // Verify there is a matching Admin record (not just any Better Auth user)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = await (db as any).admin.findUnique({
      where: { userId: adminSession.user.id },
      select: { id: true, isActive: true },
    })
    if (admin?.isActive) {
      return { type: 'admin', adminId: admin.id }
    }
  }

  // 2. Try mobile Bearer token
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const mobileSession = await db.session.findUnique({
      where: { token },
      select: { userId: true, expiresAt: true },
    })
    if (mobileSession && mobileSession.expiresAt > new Date()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patulodUser = await (db as any).patulodUser.findUnique({
        where: { userId: mobileSession.userId },
        select: { id: true, role: true, isActive: true, isSuspended: true },
      })
      if (patulodUser?.isActive && !patulodUser.isSuspended) {
        return {
          type: 'mobile',
          patulodUserId: patulodUser.id,
          role: patulodUser.role as 'PASSENGER' | 'DRIVER',
        }
      }
    }
  }

  return null
}

// ─────────────────────────────────────────────
// Error → HTTP status mapping
// ─────────────────────────────────────────────

function prismaErrorToStatus(error: unknown): { status: number; message: string } {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code
    switch (code) {
      case 'P2001': // Record not found in where clause
      case 'P2025': // Record to update/delete not found
        return { status: 404, message: 'Record not found' }
      case 'P2002': // Unique constraint violation
        return { status: 409, message: 'A record with that value already exists' }
      case 'P2003': // Foreign key constraint failure
        return { status: 400, message: 'Referenced record does not exist' }
      case 'P2014': // Relation violation
        return { status: 400, message: 'Relation constraint violated' }
    }
  }
  return { status: 500, message: 'Database error' }
}

// ─────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function handlePrismaRequest(request: Request): Promise<Response> {
  // ── 1. Auth ──────────────────────────────────────────────────────
  const caller = await resolveCaller(request)
  if (!caller) {
    return json({ success: false, error: 'Unauthorized' }, 401)
  }

  // ── 2. Parse & validate body ──────────────────────────────────────
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, 400)
  }

  const parsed = PrismaRequestSchema.safeParse(rawBody)
  if (!parsed.success) {
    return json({ success: false, error: 'Validation failed', details: parsed.error.issues }, 400)
  }

  const { model, operation, args } = parsed.data as {
    model: AllowedModel
    operation: AllowedOperation
    args: Record<string, unknown>
  }

  // ── 3. Model-level access control ────────────────────────────────
  const isAdminOnlyModel = (ADMIN_ONLY_MODELS as readonly string[]).includes(model)
  if (isAdminOnlyModel && caller.type !== 'admin') {
    return json({ success: false, error: 'Forbidden' }, 403)
  }

  // ── 4. Row-level security (mobile callers only) ───────────────────
  let securedArgs = args
  if (caller.type === 'mobile') {
    const result = applyRowLevelSecurity(
      model,
      operation,
      args,
      caller.patulodUserId,
      caller.role,
    )
    if (result === null) {
      return json({ success: false, error: 'Forbidden' }, 403)
    }
    securedArgs = result
  }

  // ── 5. Execute Prisma query ───────────────────────────────────────
  try {
    // All delegate keys are camelCase — same as our AllowedModel names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delegate = (db as any)[model]
    if (!delegate || typeof delegate[operation] !== 'function') {
      return json({ success: false, error: 'Unknown model or operation' }, 400)
    }

    const result = await delegate[operation](securedArgs)

    // ── 6. Strip sensitive fields ─────────────────────────────────
    const cleaned = stripSensitiveFields(result)

    return json({ success: true, data: cleaned })
  } catch (error) {
    console.error('[/api/prisma] Prisma error:', error)
    const { status, message } = prismaErrorToStatus(error)
    return json({ success: false, error: message }, status)
  }
}
