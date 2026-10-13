import { PrismaClient } from './generated/client/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const email = 'admin@patulod.com'
  const name = 'Admin User'

  // Delete existing records if they exist
  await prisma.admin.deleteMany({ where: { email } })
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({ where: { email } })
  
  console.log('✅ Cleaned up existing data')

  console.log('\n⚠️  Admin user needs to be created via signup.')
  console.log('\n📝 To create admin user:')
  console.log('   1. Start the dev server: pnpm dev')
  console.log('   2. Go to: http://localhost:3000/api/auth/sign-up/email')
  console.log('   3. POST with body:')
  console.log('      {')
  console.log('        "email": "admin@patulod.com",')
  console.log('        "password": "admin123",')
  console.log('        "name": "Admin User"')
  console.log('      }')
  console.log('\n   Or use the create-admin.ts script after server is running.')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

