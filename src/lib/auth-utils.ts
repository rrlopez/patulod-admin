import { auth } from './auth'
import { db } from '../db'

export async function getAdminFromSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session || !session.user) {
    return null
  }

  // Find the corresponding Admin record
  const admin = await db.admin.findUnique({
    where: { userId: session.user.id },
  })

  if (!admin || !admin.isActive) {
    return null
  }

  return {
    session,
    admin,
    user: session.user,
  }
}

export async function requireAdminAuth(request: Request) {
  const authData = await getAdminFromSession(request)
  
  if (!authData) {
    throw new Response('Unauthorized', { status: 401 })
  }

  return authData
}

export function checkAdminRole(
  admin: { role: string },
  allowedRoles: string[]
): boolean {
  return allowedRoles.includes(admin.role)
}
