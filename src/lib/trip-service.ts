import { prisma } from '../db'
import { calculateCommission, calculateDriverEarnings } from './services/fare-calculator'
import type { RideStatus } from '../../prisma/generated/client'

/**
 * Validate state transition
 */
function isValidTransition(from: RideStatus, to: RideStatus): boolean {
  const validTransitions: Record<RideStatus, RideStatus[]> = {
    SEARCHING: ['DRIVER_ASSIGNED', 'CANCELLED', 'NO_DRIVER_FOUND'],
    DRIVER_ASSIGNED: ['DRIVER_ARRIVED', 'CANCELLED'],
    DRIVER_ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    NO_DRIVER_FOUND: ['SEARCHING'],
  }

  return validTransitions[from]?.includes(to) || false
}

/**
 * Mark driver as arrived at pickup location
 */
export async function markDriverArrived(params: {
  tripId: string
  driverId: string
}): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        booking: true,
      },
    })

    if (!trip) {
      return {
        success: false,
        errors: { tripId: 'Trip not found' },
      }
    }

    if (trip.driverId !== params.driverId) {
      return {
        success: false,
        errors: { driverId: 'Unauthorized' },
      }
    }

    if (!isValidTransition(trip.booking.status, 'DRIVER_ARRIVED')) {
      return {
        success: false,
        errors: { status: `Cannot mark arrived from status ${trip.booking.status}` },
      }
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: trip.bookingId },
      data: {
        status: 'DRIVER_ARRIVED',
      },
    })

    // Create booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId: trip.bookingId,
        fromStatus: trip.booking.status,
        toStatus: 'DRIVER_ARRIVED',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        reason: 'Driver marked arrival at pickup location',
      },
    })

    // Create trip event
    await prisma.tripEvent.create({
      data: {
        tripId: trip.id,
        fromStatus: trip.booking.status,
        toStatus: 'DRIVER_ARRIVED',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        reason: 'Driver arrived at pickup',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: params.driverId,
        entity: 'Trip',
        action: 'ARRIVED',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        metadata: {
          tripId: trip.id,
          bookingId: trip.bookingId,
        },
      },
    })

    // TODO: Emit Socket.IO event trip:driver_arrived

    return {
      success: true,
      message: 'Marked as arrived',
    }
  } catch (error) {
    console.error('Mark arrived error:', error)
    return {
      success: false,
      message: 'Failed to mark arrival',
    }
  }
}

/**
 * Start trip (after pickup confirmation)
 */
export async function startTrip(params: {
  tripId: string
  driverId: string
}): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        booking: true,
      },
    })

    if (!trip) {
      return {
        success: false,
        errors: { tripId: 'Trip not found' },
      }
    }

    if (trip.driverId !== params.driverId) {
      return {
        success: false,
        errors: { driverId: 'Unauthorized' },
      }
    }

    if (!isValidTransition(trip.booking.status, 'IN_PROGRESS')) {
      return {
        success: false,
        errors: { status: `Cannot start trip from status ${trip.booking.status}` },
      }
    }

    // Update booking status and trip startedAt
    await prisma.booking.update({
      where: { id: trip.bookingId },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        startedAt: new Date(),
      },
    })

    // Create booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId: trip.bookingId,
        fromStatus: trip.booking.status,
        toStatus: 'IN_PROGRESS',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        reason: 'Trip started',
      },
    })

    // Create trip event
    await prisma.tripEvent.create({
      data: {
        tripId: trip.id,
        fromStatus: trip.booking.status,
        toStatus: 'IN_PROGRESS',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        reason: 'Trip started',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: params.driverId,
        entity: 'Trip',
        action: 'START',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        metadata: {
          tripId: trip.id,
          bookingId: trip.bookingId,
        },
      },
    })

    // TODO: Emit Socket.IO event trip:started

    return {
      success: true,
      message: 'Trip started',
    }
  } catch (error) {
    console.error('Start trip error:', error)
    return {
      success: false,
      message: 'Failed to start trip',
    }
  }
}

/**
 * Complete trip and create earnings record
 */
export async function completeTrip(params: {
  tripId: string
  driverId: string
  finalFare?: number
  fareAdjustmentReason?: string
}): Promise<{ success: boolean; data?: any; message?: string; errors?: Record<string, string> }> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        booking: {
          include: {
            fareConfig: true,
          },
        },
      },
    })

    if (!trip) {
      return {
        success: false,
        errors: { tripId: 'Trip not found' },
      }
    }

    if (trip.driverId !== params.driverId) {
      return {
        success: false,
        errors: { driverId: 'Unauthorized' },
      }
    }

    if (!isValidTransition(trip.booking.status, 'COMPLETED')) {
      return {
        success: false,
        errors: { status: `Cannot complete trip from status ${trip.booking.status}` },
      }
    }

    if (!trip.startedAt) {
      return {
        success: false,
        errors: { status: 'Cannot complete trip that was not started' },
      }
    }

    // Use final fare or booking estimate
    const fareAmount = params.finalFare || Number(trip.booking.fareEstimate)
    const fareConfig = trip.booking.fareConfig!

    // Calculate earnings
    const commission = calculateCommission(fareAmount, fareConfig)
    const driverEarnings = calculateDriverEarnings(fareAmount, fareConfig)

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: trip.bookingId },
        data: {
          status: 'COMPLETED',
        },
      })

      // Update trip
      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: {
          completedAt: new Date(),
          finalFare: fareAmount,
          fareAdjustmentReason: params.fareAdjustmentReason,
        },
      })

      // Create earnings record
      const earnings = await tx.earnings.create({
        data: {
          driverId: trip.driverId,
          tripId: trip.id,
          passengerFare: fareAmount,
          driverEarnings,
          platformCommission: commission,
          adjustmentAmount: 0,
        },
      })

      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: trip.bookingId,
          fareDue: fareAmount,
          method: trip.booking.paymentMethod,
          status: 'PENDING',
        },
      })

      // Create booking event
      await tx.bookingEvent.create({
        data: {
          bookingId: trip.bookingId,
          fromStatus: trip.booking.status,
          toStatus: 'COMPLETED',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          reason: 'Trip completed',
        },
      })

      // Create trip event
      await tx.tripEvent.create({
        data: {
          tripId: trip.id,
          fromStatus: trip.booking.status,
          toStatus: 'COMPLETED',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          reason: 'Trip completed',
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: params.driverId,
          entity: 'Trip',
          action: 'COMPLETE',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          metadata: {
            tripId: trip.id,
            bookingId: trip.bookingId,
            finalFare: fareAmount,
            earnings: driverEarnings,
          },
        },
      })

      return { trip: updatedTrip, earnings, payment }
    })

    // TODO: Emit Socket.IO event trip:completed

    return {
      success: true,
      data: result,
      message: 'Trip completed',
    }
  } catch (error) {
    console.error('Complete trip error:', error)
    return {
      success: false,
      message: 'Failed to complete trip',
    }
  }
}
