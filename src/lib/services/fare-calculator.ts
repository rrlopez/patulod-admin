import type { FareConfig } from '../../../prisma/generated/client'

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 100) / 100 // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate fare estimate based on distance
 */
export function calculateDistanceBasedFare(
  distanceKm: number,
  fareConfig: FareConfig
): number {
  const baseFare = Number(fareConfig.baseFare)
  const perKmRate = Number(fareConfig.perKmRate)
  const minimumFare = Number(fareConfig.minimumFare)

  const calculatedFare = baseFare + distanceKm * perKmRate
  const finalFare = Math.max(calculatedFare, minimumFare)

  return Math.round(finalFare * 100) / 100 // Round to 2 decimal places
}

/**
 * Calculate platform commission from passenger fare
 */
export function calculateCommission(
  passengerFare: number,
  fareConfig: FareConfig
): number {
  const commissionRate = Number(fareConfig.platformCommission) / 100
  const commission = passengerFare * commissionRate

  return Math.round(commission * 100) / 100
}

/**
 * Calculate driver earnings after platform commission
 */
export function calculateDriverEarnings(
  passengerFare: number,
  fareConfig: FareConfig
): number {
  const commission = calculateCommission(passengerFare, fareConfig)
  const driverEarnings = passengerFare - commission

  return Math.round(driverEarnings * 100) / 100
}

/**
 * Get fixed fare for specific service types
 * Returns null if no fixed fare defined
 */
export function getFixedFare(
  serviceType: string,
  pickupArea?: string,
  destinationArea?: string
): number | null {
  // Fixed fares can be configured per route or service type
  // For now, return null (use distance-based calculation)
  // Future: query from FixedFareRoute table
  return null
}

/**
 * Main fare calculation function
 * Attempts fixed fare first, falls back to distance-based
 */
export function calculateFare(params: {
  pickupLat: number
  pickupLng: number
  destinationLat: number
  destinationLng: number
  serviceType: string
  fareConfig: FareConfig
}): {
  fare: number
  fareType: 'ESTIMATED' | 'FIXED'
  distanceKm: number
  breakdown: {
    baseFare: number
    distanceCharge: number
    total: number
  }
} {
  const { pickupLat, pickupLng, destinationLat, destinationLng, serviceType, fareConfig } = params

  // Try fixed fare first
  const fixedFare = getFixedFare(serviceType)
  if (fixedFare !== null) {
    const distanceKm = calculateDistance(pickupLat, pickupLng, destinationLat, destinationLng)
    return {
      fare: fixedFare,
      fareType: 'FIXED',
      distanceKm,
      breakdown: {
        baseFare: fixedFare,
        distanceCharge: 0,
        total: fixedFare,
      },
    }
  }

  // Fall back to distance-based calculation
  const distanceKm = calculateDistance(pickupLat, pickupLng, destinationLat, destinationLng)
  const baseFare = Number(fareConfig.baseFare)
  const perKmRate = Number(fareConfig.perKmRate)
  const distanceCharge = distanceKm * perKmRate
  const fare = calculateDistanceBasedFare(distanceKm, fareConfig)

  return {
    fare,
    fareType: 'ESTIMATED',
    distanceKm,
    breakdown: {
      baseFare,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      total: fare,
    },
  }
}
