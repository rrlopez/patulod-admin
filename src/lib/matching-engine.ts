import { prisma } from '../db'
import { calculateDistance } from './services/fare-calculator'
import { calculateBoundingBox } from './services/geofencing'
// TODO: import { emitSocketEvent } from './socket'

interface EligibleDriver {
  id: string
  fullName: string
  distance: number
}

/**
 * Start the matching process for a booking
 */
export async function startMatching(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      console.error('Booking not found:', bookingId)
      return
    }

    // Get matching configuration
    const [timeoutConfig, poolSizeConfig] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { key: 'matching_timeout_seconds' },
      }),
      prisma.systemConfig.findUnique({
        where: { key: 'max_driver_pool_size' },
      }),
    ])

    const timeoutSeconds = Number(timeoutConfig?.value || 30)
    const maxPoolSize = Number(poolSizeConfig?.value || 20)

    // Emit searching event to passenger
    // TODO: emitSocketEvent(`booking:${bookingId}`, 'booking:searching', { bookingId })

    // Find eligible drivers
    const eligibleDrivers = await findEligibleDrivers(
      booking.pickupLat!.toNumber(),
      booking.pickupLng!.toNumber(),
      booking.serviceType,
      maxPoolSize
    )

    if (eligibleDrivers.length === 0) {
      // No drivers found immediately
      await handleNoDriversFound(bookingId)
      return
    }

    // Notify drivers about ride request
    for (const driver of eligibleDrivers) {
      // TODO: emitSocketEvent(`driver:${driver.id}`, 'driver:ride_request', {
      //   bookingId: booking.id,
      //   pickupAddress: booking.pickupAddress,
      //   destinationAddress: booking.destinationAddress,
      //   fareEstimate: Number(booking.fareEstimate),
      //   distance: driver.distance,
      // })
    }

    // Set timeout for no driver response
    setTimeout(async () => {
      await checkMatchingTimeout(bookingId)
    }, timeoutSeconds * 1000)
  } catch (error) {
    console.error('Matching error:', error)
  }
}

/**
 * Find eligible drivers near the pickup location
 */
async function findEligibleDrivers(
  pickupLat: number,
  pickupLng: number,
  serviceType: string,
  maxPoolSize: number
): Promise<EligibleDriver[]> {
  try {
    // Calculate bounding box (20km radius for initial query)
    const bbox = calculateBoundingBox(pickupLat, pickupLng, 20)

    // Find online drivers in the area
    const drivers = await prisma.patulodUser.findMany({
      where: {
        role: 'DRIVER',
        isActive: true,
        isSuspended: false,
        driverAvailability: {
          isOnline: true,
        },
        // TODO: Add driver application status check
        // TODO: Add service type matching (motorcycle, tricycle)
      },
      include: {
        driverAvailability: true,
      },
      take: maxPoolSize * 2, // Get more than needed for distance filtering
    })

    // Calculate distances and sort by proximity
    const driversWithDistance = drivers
      .map((driver) => {
        // TODO: Get driver's last known location
        // For now, use placeholder distance calculation
        const distance = calculateDistance(
          pickupLat,
          pickupLng,
          pickupLat + 0.01, // Placeholder
          pickupLng + 0.01 // Placeholder
        )

        return {
          id: driver.id,
          fullName: driver.fullName,
          distance,
        }
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxPoolSize)

    return driversWithDistance
  } catch (error) {
    console.error('Find eligible drivers error:', error)
    return []
  }
}

/**
 * Handle case when no drivers are found
 */
async function handleNoDriversFound(bookingId: string): Promise<void> {
  try {
    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'NO_DRIVER_FOUND',
      },
    })

    // Create booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId,
        fromStatus: 'SEARCHING',
        toStatus: 'NO_DRIVER_FOUND',
        actorId: null,
        actorRole: null,
        reason: 'No drivers available',
      },
    })

    // Emit no driver found event to passenger
    // TODO: emitSocketEvent(`booking:${bookingId}`, 'booking:no_driver_found', {
    //   bookingId,
    //   message: 'No drivers available at the moment. Please try again.',
    // })
  } catch (error) {
    console.error('Handle no drivers found error:', error)
  }
}

/**
 * Check if matching timed out
 */
async function checkMatchingTimeout(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return
    }

    // If still searching after timeout, mark as no driver found
    if (booking.status === 'SEARCHING') {
      await handleNoDriversFound(bookingId)
    }
  } catch (error) {
    console.error('Check matching timeout error:', error)
  }
}

/**
 * Continue matching after driver decline
 */
export async function continueMatching(bookingId: string): Promise<void> {
  // TODO: Implement logic to notify next set of drivers
  // For now, just restart matching
  await startMatching(bookingId)
}
