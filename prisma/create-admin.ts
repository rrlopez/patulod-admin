// Script to create an admin user with properly hashed password
import { PrismaClient } from './generated/client/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔧 Creating admin user via Better Auth signup...')

  const email = 'admin@patulod.com'
  const password = 'admin123'
  const name = 'Admin User'

  // Use Better Auth API to create user with properly hashed password
  const baseURL = 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': baseURL,
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.log('⚠️  Signup failed (user might already exist):', error)
    } else {
      const result = await response.json()
      console.log('✅ User created via Better Auth:', result)
    }

    // Find or create the user in database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log('❌ User not found after signup')
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.email}`)

    // Create the Admin record linked to the user
    const admin = await prisma.admin.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        fullName: name,
        email: email,
        phone: '+63 917 123 4567',
        userId: user.id,
        isActive: true,
        role: 'SUPER_ADMIN',
      },
    })

    console.log(`✅ Created admin: ${admin.fullName} (${admin.role})`)
    console.log('\n📧 Login credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
