import { parsePhoneNumber } from 'libphonenumber-js'
import { db } from '../db'
import { auth } from './auth'

// Validation constants
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  termsVersion: string
  privacyVersion: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: {
    id: string
    fullName: string
    email: string
    phone?: string
    role: string
  }
  session?: {
    token: string
    expiresAt: string
  }
  error?: string
  errors?: Record<string, string>
  reason?: string
}

export async function registerPassenger(body: RegisterRequest): Promise<AuthResponse> {
  try {
    // Validation
    const errors: Record<string, string> = {}

    // Validate full name
    if (!body.fullName || body.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters'
    }
    if (body.fullName && !/^[a-zA-Z\s'-]+$/.test(body.fullName)) {
      errors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes'
    }

    // Validate email
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      errors.email = 'Invalid email address'
    }

    // Check email duplicate
    if (body.email) {
      const existingEmail = await db.user.findUnique({
        where: { email: body.email.toLowerCase() },
      })
      if (existingEmail) {
        errors.email = 'Email already registered'
      }
    }

    // Validate phone (PH format)
    let normalizedPhone = body.phone
    try {
      const phoneNumber = parsePhoneNumber(body.phone, 'PH')
      if (!phoneNumber.isValid()) {
        errors.phone = 'Invalid Philippine phone number'
      } else {
        normalizedPhone = phoneNumber.number

        // Check phone duplicate
        const existingPhone = await db.patulodUser.findUnique({
          where: { phone: normalizedPhone },
        })
        if (existingPhone) {
          errors.phone = 'Phone number already registered'
        }
      }
    } catch (error) {
      errors.phone = 'Invalid phone number format'
    }

    // Validate password
    if (!body.password || body.password.length < PASSWORD_MIN_LENGTH) {
      errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    }
    if (body.password && !PASSWORD_REGEX.test(body.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number'
    }
    if (body.password !== body.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    // Validate terms and privacy acceptance
    if (!body.termsVersion) {
      errors.terms = 'You must accept the Terms and Understanding'
    }
    if (!body.privacyVersion) {
      errors.privacy = 'You must acknowledge the Privacy Notice'
    }

    // Return validation errors
    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    // Create Better Auth user using signUp API
    try {
      const signUpResult = await auth.api.signUpEmail({
        body: {
          email: body.email.toLowerCase(),
          password: body.password,
          name: body.fullName,
        },
        asResponse: false,
      })

      if (!signUpResult) {
        console.error('Better Auth signUp returned null/undefined')
        return { success: false, error: 'Failed to create account' }
      }

      console.log('✅ Better Auth user created:', signUpResult.user.id)

      // Extract session token
      let token: string
      let expiresAt: Date

      if (signUpResult.token) {
        // Token available directly from signup result
        token = signUpResult.token
        
        // Get the session expiry from DB
        const sessionData = await db.session.findFirst({
          where: { userId: signUpResult.user.id },
          orderBy: { createdAt: 'desc' },
          select: { expiresAt: true },
        })
        
        if (!sessionData) {
          console.error('❌ Session data not found for user:', signUpResult.user.id)
          return { success: false, error: 'Account created but session could not be established. Please log in.' }
        }
        
        expiresAt = sessionData.expiresAt
      } else {
        // Fallback: query DB for session token
        const sessionData = await db.session.findFirst({
          where: { userId: signUpResult.user.id },
          orderBy: { createdAt: 'desc' },
          select: { token: true, expiresAt: true },
        })

        if (!sessionData?.token) {
          console.error('❌ Session token not found for user:', signUpResult.user.id)
          return { success: false, error: 'Account created but session could not be established. Please log in.' }
        }

        token = sessionData.token
        expiresAt = sessionData.expiresAt
      }

      // Wrap PatulodUser creation and related records in a transaction
      await db.$transaction(async (tx) => {
        const now = new Date()
        const patulodUser = await tx.patulodUser.create({
          data: {
            fullName: body.fullName.trim(),
            phone: normalizedPhone,
            userId: signUpResult.user.id,
            role: 'PASSENGER', // Always PASSENGER for registration
            termsAcceptedAt: now,
            privacyAcknowledgedAt: now,
          },
        })

        console.log('✅ PatulodUser created with ID:', patulodUser.id)

        // Create acceptance records using PatulodUser ID
        await tx.termsAcceptance.create({
          data: {
            userId: patulodUser.id, // Use PatulodUser ID, not Better Auth user ID
            termsVersion: body.termsVersion,
          },
        })

        await tx.privacyAcknowledgment.create({
          data: {
            userId: patulodUser.id, // Use PatulodUser ID, not Better Auth user ID
            noticeVersion: body.privacyVersion,
          },
        })

        console.log('✅ Terms and Privacy records created')

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: patulodUser.id, // Use PatulodUser ID
            entity: 'PatulodUser',
            action: 'REGISTER',
            actorId: patulodUser.id, // Use PatulodUser ID
            actorRole: 'PASSENGER',
            metadata: {
              email: body.email,
              phone: normalizedPhone,
            },
          },
        })
      })

      console.log('✅ Registration complete for:', body.email)

      return {
        success: true,
        user: {
          id: signUpResult.user.id,
          fullName: body.fullName,
          email: signUpResult.user.email,
          phone: normalizedPhone,
          role: 'PASSENGER',
        },
        session: {
          token,
          expiresAt: expiresAt.toISOString(),
        },
      }
    } catch (authError) {
      console.error('❌ signUpEmail error:', authError)
      return { success: false, error: 'Failed to create account. Please try again.' }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

export async function loginPassenger(body: LoginRequest): Promise<AuthResponse> {
  try {
    // Basic validation
    if (!body.email || !body.password) {
      return { success: false, error: 'Email and password are required' }
    }

    // Use Better Auth's signIn API
    const signInResult = await auth.api.signInEmail({
      body: {
        email: body.email.toLowerCase(),
        password: body.password,
      },
      asResponse: false,
    })

    if (!signInResult) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Extract session token
    let token: string
    let expiresAt: Date

    if (signInResult.token) {
      // Token available directly from signin result
      token = signInResult.token
      
      // Get the session expiry from DB
      const sessionData = await db.session.findFirst({
        where: { userId: signInResult.user.id },
        orderBy: { createdAt: 'desc' },
        select: { expiresAt: true },
      })
      
      if (!sessionData) {
        console.error('❌ Session data not found for user:', signInResult.user.id)
        return { success: false, error: 'Login succeeded but session could not be established. Please try again.' }
      }
      
      expiresAt = sessionData.expiresAt
    } else {
      // Fallback: query DB for session token
      const sessionData = await db.session.findFirst({
        where: { userId: signInResult.user.id },
        orderBy: { createdAt: 'desc' },
        select: { token: true, expiresAt: true },
      })

      if (!sessionData?.token) {
        console.error('❌ Session token not found for user:', signInResult.user.id)
        return { success: false, error: 'Login succeeded but session could not be established. Please try again.' }
      }

      token = sessionData.token
      expiresAt = sessionData.expiresAt
    }

    // Get PatulodUser data
    const patulodUser = await db.patulodUser.findUnique({
      where: { userId: signInResult.user.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedReason: true,
      },
    })

    if (!patulodUser) {
      return { success: false, error: 'User account not found' }
    }

    // Check if user is suspended
    if (patulodUser.isSuspended) {
      return {
        success: false,
        error: 'Your account has been suspended',
        reason: patulodUser.suspendedReason || undefined,
      }
    }

    // Check if user is active
    if (!patulodUser.isActive) {
      return { success: false, error: 'Your account is inactive' }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: patulodUser.id,
        entity: 'PatulodUser',
        action: 'LOGIN',
        actorId: patulodUser.id,
        actorRole: patulodUser.role,
        metadata: {
          email: body.email,
        },
      },
    })

    return {
      success: true,
      user: {
        id: signInResult.user.id,
        fullName: patulodUser.fullName,
        email: signInResult.user.email,
        phone: patulodUser.phone,
        role: patulodUser.role,
      },
      session: {
        token,
        expiresAt: expiresAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

export async function logoutPassenger(headers: Headers): Promise<AuthResponse> {
  try {
    // Get session to find user
    const session = await auth.api.getSession({ headers })

    if (session?.user) {
      // Get PatulodUser to log the action
      const patulodUser = await db.patulodUser.findUnique({
        where: { userId: session.user.id },
        select: { id: true, role: true },
      })

      if (patulodUser) {
        // Create audit log before signing out
        await db.auditLog.create({
          data: {
            userId: patulodUser.id,
            entity: 'PatulodUser',
            action: 'LOGOUT',
            actorId: patulodUser.id,
            actorRole: patulodUser.role,
          },
        })
      }
    }

    // Sign out using Better Auth
    await auth.api.signOut({ headers })

    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Logout failed. Please try again.' }
  }
}

export async function getCurrentUser(headers: Headers): Promise<AuthResponse> {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({ headers })

    if (!session?.user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get PatulodUser data
    const patulodUser = await db.patulodUser.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        isSuspended: true,
        suspendedReason: true,
        termsAcceptedAt: true,
        privacyAcknowledgedAt: true,
        createdAt: true,
      },
    })

    if (!patulodUser) {
      return { success: false, error: 'User profile not found' }
    }

    // Check if suspended
    if (patulodUser.isSuspended) {
      return {
        success: false,
        error: 'Account suspended',
        reason: patulodUser.suspendedReason || undefined,
      }
    }

    return {
      success: true,
      user: {
        id: session.user.id,
        fullName: patulodUser.fullName,
        email: session.user.email,
        phone: patulodUser.phone,
        role: patulodUser.role,
      },
    }
  } catch (error) {
    console.error('Get user error:', error)
    return { success: false, error: 'Failed to get user profile' }
  }
}
