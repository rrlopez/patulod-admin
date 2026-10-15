import { PrismaClient } from '../prisma/generated/client/client.js'
import { getDatabaseUrl } from '../src/database-url.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: getDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔍 Checking ServiceArea...\n')

  const serviceAreas = await prisma.serviceArea.findMany()

  console.log(`Found ${serviceAreas.length} service area(s):\n`)

  for (const area of serviceAreas) {
    console.log(`ID: ${area.id}`)
    console.log(`Name: ${area.name}`)
    console.log(`Active: ${area.isActive}`)
    console.log(`Boundary:`, JSON.stringify(area.boundary, null, 2))
    console.log('---\n')
  }

  // Test coordinates
  const testCoords = [
    { name: 'Bayombong Town Hall', lat: 16.4833, lng: 121.1500 },
    { name: 'Bambang Public Market', lat: 16.3833, lng: 121.1000 },
    { name: 'Outside (Manila)', lat: 14.5995, lng: 120.9842 },
  ]

  console.log('\n📍 Testing coordinates:')
  const activeArea = serviceAreas.find(a => a.isActive)
  if (!activeArea) {
    console.log('  No active service area found!')
    return
  }

  console.log(`\n  Using active service area: ${activeArea.name}\n`)
  
  for (const coord of testCoords) {
    const inArea = isPointInArea(coord.lat, coord.lng, activeArea.boundary as any)
    console.log(`  ${coord.name} (${coord.lat}, ${coord.lng}): ${inArea ? '✅ INSIDE' : '❌ OUTSIDE'}`)
  }
}

function isPointInArea(lat: number, lng: number, boundary: any): boolean {
  if (!boundary?.coordinates?.[0]) return false
  
  const ring = boundary.coordinates[0]
  const point: [number, number] = [lng, lat] // GeoJSON format is [lng, lat]

  console.log(`    Testing point [${lng}, ${lat}] against ring:`, ring)

  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi

    if (intersect) inside = !inside
  }

  console.log(`    Result: ${inside}`)
  return inside
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
