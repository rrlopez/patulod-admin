/**
 * Script to delete all users and start fresh
 * WARNING: This will delete ALL user data
 * Run with: npx tsx scripts/reset-all-users.ts
 */
import { db } from '../src/db.js'

async function resetAllUsers() {
  try {
    console.log('⚠️  WARNING: This will delete ALL users and related data!')
    console.log('Starting in 3 seconds...\n')
    
    await new Promise(resolve => setTimeout(resolve, 3000))

    console.log('🗑️  Deleting all data...\n')

    // Delete in correct order to respect foreign keys
    await db.booking.deleteMany({})
    console.log('✅ Deleted bookings')

    await db.auditLog.deleteMany({})
    console.log('✅ Deleted audit logs')

    await db.privacyAcknowledgment.deleteMany({})
    console.log('✅ Deleted privacy acknowledgments')

    await db.termsAcceptance.deleteMany({})
    console.log('✅ Deleted terms acceptances')

    await db.patulodUser.deleteMany({})
    console.log('✅ Deleted PatulodUser records')

    await db.session.deleteMany({})
    console.log('✅ Deleted sessions')

    await db.account.deleteMany({})
    console.log('✅ Deleted accounts')

    await db.user.deleteMany({})
    console.log('✅ Deleted users')

    console.log('\n🎉 All users deleted successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Restart your dev server to load the new BETTER_AUTH_SECRET')
    console.log('   2. Register new users through the app')
    console.log('   3. They will now be able to login properly')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

resetAllUsers()
