/**
 * Diagnostic script to check Better Auth account records
 * Run with: npx tsx scripts/check-auth-accounts.ts
 */
import { db } from '../src/db.js'

async function checkAccounts() {
  try {
    console.log('🔍 Checking Better Auth accounts...\n')

    // Get all users
    const users = await db.user.findMany({
      include: {
        accounts: true,
      },
    })

    console.log(`Found ${users.length} users\n`)

    for (const user of users) {
      console.log(`📧 User: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Name: ${user.name}`)
      console.log(`   Email Verified: ${user.emailVerified}`)
      console.log(`   Accounts: ${user.accounts.length}`)

      for (const account of user.accounts) {
        console.log(`   ├─ Provider: ${account.providerId}`)
        console.log(`   ├─ Account ID: ${account.accountId}`)
        console.log(`   └─ Has Password: ${!!account.password}`)
      }

      console.log('')
    }

    // Check for PatulodUser associations
    const patulodUsers = await db.patulodUser.findMany({
      select: {
        id: true,
        fullName: true,
        userId: true,
        role: true,
      },
    })

    console.log(`\n📊 PatulodUser records: ${patulodUsers.length}`)
    for (const pUser of patulodUsers) {
      const user = users.find(u => u.id === pUser.userId)
      console.log(`   ${pUser.fullName} (${pUser.role})`)
      console.log(`   └─ Linked to: ${user?.email || 'NOT FOUND'}`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkAccounts()
