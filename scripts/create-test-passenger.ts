/**
 * Script to create a test passenger account with proper Better Auth setup
 * Run with: npx tsx scripts/create-test-passenger.ts
 */
import { auth } from '../src/lib/auth.js'
import { db } from '../src/db.js'

async function createTestPassenger() {
  try {
    const email = 'testpassenger@patulod.com'
    const password = 'Test123456'
    const fullName = 'Test Passenger'

    console.log('🧪 Creating test passenger account...\n')

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { accounts: true },
    })

    if (existingUser) {
      console.log('⚠️  User already exists:', email)
      console.log('   Has account record:', existingUser.accounts.length > 0)
      
      if (existingUser.accounts.length > 0) {
        console.log('✅ This user can login with password:', password)
        await db.$disconnect()
        return
      }

      console.log('🗑️  Deleting incomplete user record...')
      // Delete related records first
      await db.patulodUser.deleteMany({
        where: { userId: existingUser.id },
      })
      await db.user.delete({
        where: { id: existingUser.id },
      })
    }

    // Create user using Better Auth
    console.log('📝 Creating Better Auth user...')
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase(),
        password: password,
        name: fullName,
      },
      asResponse: false,
    })

    if (!signUpResult) {
      console.error('❌ Failed to create Better Auth user')
      await db.$disconnect()
      return
    }

    console.log('✅ Better Auth user created:', signUpResult.user.id)

    // Verify account was created
    const accountCheck = await db.account.findFirst({
      where: { userId: signUpResult.user.id },
    })

    if (!accountCheck) {
      console.error('❌ CRITICAL: Account record not created!')
      await db.$disconnect()
      return
    }

    console.log('✅ Account record verified:', accountCheck.providerId)

    // Create PatulodUser
    console.log('📝 Creating PatulodUser...')
    const now = new Date()
    const patulodUser = await db.patulodUser.create({
      data: {
        fullName: fullName,
        phone: '+639123456789',
        userId: signUpResult.user.id,
        role: 'PASSENGER',
        termsAcceptedAt: now,
        privacyAcknowledgedAt: now,
      },
    })

    console.log('✅ PatulodUser created:', patulodUser.id)

    // Create acceptance records
    await db.termsAcceptance.create({
      data: {
        userId: patulodUser.id,
        termsVersion: '1.0',
      },
    })

    await db.privacyAcknowledgment.create({
      data: {
        userId: patulodUser.id,
        noticeVersion: '1.0',
      },
    })

    console.log('✅ Terms and privacy records created')

    console.log('\n🎉 Test passenger created successfully!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', email)
    console.log('🔑 Password:', password)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\nYou can now login with these credentials!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

createTestPassenger()
