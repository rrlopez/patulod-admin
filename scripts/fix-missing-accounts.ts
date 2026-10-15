/**
 * Script to identify and optionally fix users missing account records
 * Run with: npx tsx scripts/fix-missing-accounts.ts
 */
import { db } from '../src/db.js'

async function fixMissingAccounts() {
  try {
    console.log('🔍 Checking for users without account records...\n')

    // Get all users
    const users = await db.user.findMany({
      include: {
        accounts: true,
      },
    })

    const usersWithoutAccounts = users.filter(u => u.accounts.length === 0)

    console.log(`Found ${usersWithoutAccounts.length} users without account records:\n`)

    for (const user of usersWithoutAccounts) {
      console.log(`❌ ${user.email} (ID: ${user.id})`)
    }

    if (usersWithoutAccounts.length === 0) {
      console.log('\n✅ All users have account records!')
      return
    }

    console.log('\n⚠️  These users cannot log in because they have no account/password records.')
    console.log('📝 Possible causes:')
    console.log('   1. Registration failed partway through')
    console.log('   2. Better Auth configuration changed')
    console.log('   3. Database migration issue')
    console.log('\n💡 Solutions:')
    console.log('   1. Have users re-register with a different email')
    console.log('   2. Manually delete these user records and have them register again')
    console.log('   3. Create a password reset flow')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

fixMissingAccounts()
