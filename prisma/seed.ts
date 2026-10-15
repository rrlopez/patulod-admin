import { PrismaClient } from './generated/client/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function seedSystemConfig() {
  console.log('\n📋 Seeding system configuration...')

  const configs = [
    {
      key: 'matching_timeout_seconds',
      value: '30',
      description: 'Timeout in seconds for finding a driver',
    },
    {
      key: 'max_driver_pool_size',
      value: '20',
      description: 'Maximum number of drivers to notify simultaneously',
    },
    {
      key: 'cancellation_fee_passenger_before_assignment',
      value: '0',
      description: 'Fee charged to passenger for cancelling before driver assignment (PHP)',
    },
    {
      key: 'cancellation_fee_passenger_after_assignment',
      value: '20',
      description: 'Fee charged to passenger for cancelling after driver assignment (PHP)',
    },
    {
      key: 'cancellation_fee_driver_after_acceptance',
      value: '0',
      description: 'Fee charged to driver for cancelling after accepting ride (PHP)',
    },
    {
      key: 'distance_calculation_method',
      value: 'HAVERSINE',
      description: 'Method for distance calculation: HAVERSINE or GOOGLE_MAPS',
    },
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    })
  }

  console.log('✅ System configuration seeded')
}

async function seedFareConfig() {
  console.log('\n💰 Seeding fare configuration...')

  await prisma.fareConfig.upsert({
    where: { version: '1.0' },
    update: {},
    create: {
      version: '1.0',
      baseFare: 40,
      perKmRate: 15,
      minimumFare: 40,
      platformCommission: 20, // 20%
      isActive: true,
    },
  })

  console.log('✅ Fare configuration seeded')
}

async function seedServiceArea() {
  console.log('\n🗺️  Seeding service area...')

  // Nueva Vizcaya Province boundaries
  // Covers the entire province including Bayombong (capital), Bambang, Solano, etc.
  const nuevaVizcayaBoundary = {
    type: 'Polygon',
    coordinates: [
      [
        [121.000, 15.900],  // Southwest corner
        [122.000, 15.900],  // Southeast corner
        [122.000, 16.900],  // Northeast corner
        [121.000, 16.900],  // Northwest corner
        [121.000, 15.900],  // Close polygon
      ],
    ],
  }

  await prisma.serviceArea.upsert({
    where: { id: 'nueva-vizcaya' },
    update: {
      boundary: nuevaVizcayaBoundary,
    },
    create: {
      id: 'nueva-vizcaya',
      name: 'Nueva Vizcaya Province',
      boundary: nuevaVizcayaBoundary,
      isActive: true,
    },
  })

  console.log('✅ Service area seeded (Nueva Vizcaya Province)')
}

async function main() {
  console.log('🌱 Seeding database...')

  const email = 'admin@patulod.com'
  const name = 'Admin User'

  // Delete existing records if they exist
  await prisma.admin.deleteMany({ where: { email } })
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({ where: { email } })
  
  console.log('✅ Cleaned up existing data')

  // Deactivate all other service areas (only Nueva Vizcaya should be active)
  await prisma.serviceArea.updateMany({
    where: {
      id: {
        not: 'nueva-vizcaya'
      }
    },
    data: {
      isActive: false
    }
  })
  console.log('✅ Deactivated other service areas')

  // Seed system configuration
  await seedSystemConfig()

  // Seed fare configuration
  await seedFareConfig()

  // Seed service area
  await seedServiceArea()

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
  console.log('\n✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

