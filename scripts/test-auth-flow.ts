/**
 * Script to test the complete auth flow
 * Run with: npx tsx scripts/test-auth-flow.ts
 */
import { auth } from '../src/lib/auth.js'
import { db } from '../src/db.js'

async function testAuthFlow() {
  try {
    const testEmail = `test${Date.now()}@test.com`
    const testPassword = 'Test123456'
    const testName = 'Test User'

    console.log('🧪 Testing Better Auth Flow\n')
    console.log('📧 Test Email:', testEmail)
    console.log('🔑 Test Password:', testPassword)
    console.log('')

    // Step 1: Register
    console.log('1️⃣ Testing Registration...')
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: testEmail,
        password: testPassword,
        name: testName,
      },
      asResponse: false,
    })

    if (!signUpResult) {
      console.error('❌ Registration failed - no result returned')
      await db.$disconnect()
      return
    }

    console.log('✅ Registration successful')
    console.log('   User ID:', signUpResult.user.id)
    console.log('   User Email:', signUpResult.user.email)
    console.log('   Has Token:', !!signUpResult.token)

    // Step 2: Check database
    console.log('\n2️⃣ Checking database records...')
    const user = await db.user.findUnique({
      where: { id: signUpResult.user.id },
      include: { accounts: true, sessions: true },
    })

    if (!user) {
      console.error('❌ User not found in database')
      await db.$disconnect()
      return
    }

    console.log('✅ User found in database')
    console.log('   Accounts:', user.accounts.length)
    if (user.accounts.length > 0) {
      console.log('   Account Provider:', user.accounts[0].providerId)
      console.log('   Has Password:', !!user.accounts[0].password)
      console.log('   Password Hash (first 20 chars):', user.accounts[0].password?.substring(0, 20))
    } else {
      console.error('   ❌ No account record found!')
    }
    console.log('   Sessions:', user.sessions.length)

    // Step 3: Try to login
    console.log('\n3️⃣ Testing Login (immediate)...')
    try {
      const signInResult = await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: testPassword,
        },
        asResponse: false,
      })

      if (signInResult) {
        console.log('✅ Login successful')
        console.log('   Session Token:', !!signInResult.token)
      } else {
        console.error('❌ Login failed - no result')
      }
    } catch (loginError) {
      console.error('❌ Login failed with error:', loginError)
    }

    // Step 4: Simulate server restart by checking password again
    console.log('\n4️⃣ Testing Login (simulating restart)...')
    console.log('   (Re-fetching user from database)')
    
    const userCheck = await db.user.findUnique({
      where: { email: testEmail },
      include: { accounts: true },
    })

    if (!userCheck) {
      console.error('❌ User disappeared from database')
      await db.$disconnect()
      return
    }

    console.log('✅ User still in database')
    console.log('   Has account:', userCheck.accounts.length > 0)
    
    if (userCheck.accounts.length > 0) {
      console.log('   Password hash still exists:', !!userCheck.accounts[0].password)
    }

    try {
      const signInResult2 = await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: testPassword,
        },
        asResponse: false,
      })

      if (signInResult2) {
        console.log('✅ Login after restart simulation: SUCCESS')
      } else {
        console.error('❌ Login after restart simulation: FAILED')
      }
    } catch (loginError2) {
      console.error('❌ Login after restart failed:', loginError2)
    }

    // Cleanup
    console.log('\n5️⃣ Cleaning up test user...')
    await db.session.deleteMany({ where: { userId: signUpResult.user.id } })
    await db.account.deleteMany({ where: { userId: signUpResult.user.id } })
    await db.user.delete({ where: { id: signUpResult.user.id } })
    console.log('✅ Test user deleted')

    console.log('\n🎉 Test complete!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await db.$disconnect()
  }
}

testAuthFlow()
