import { prisma } from '../db'
import { calculateFare } from './services/fare-calculator'
import { validateBookingLocations } from './services/geofencing'
import { generateBookingReference, getTodayReferencePrefix } from './services/booking-reference'
import { calculateCancellationFee, isCancellationAllowed } from './services/cancellation-fees'
import { startMatching } from './matching-engine'
import type { RideStatus } from '../../prisma/generated/client'

export interface CreateBookingRequest {
  userId: string
  pickupAddress: string
  destinationAddress: string
  pickupLat: number
  pickupLng: number
  destinationLat: number
  destinationLng: number
  serviceType: string
  passengerCount: number
  paymentMethod: string
  idempotencyKey: string
}

export interface CreateBookingResponse {
  success: boolean
  data?: {
    bookingId: string
    reference: string
    fareEstimate: number
    fareType: 'ESTIMATED' | 'FIXED'
    distanceKm: number
    breakdown: {
      baseFare: number
      distanceCharge: number
      total: number
    }
  }
  errors?: Record<string, string>
  message?: string
}

/**
 * Create a new booking (does not start matching yet)
 */
export async function createBooking(
  request: CreateBookingRequest
): Promise<CreateBookingResponse> {
  try {
    // Find PatulodUser by Better Auth userId
    const passenger = await prisma.patulodUser.findUnique({
      where: { userId: request.userId },
    })

    if (!passenger) {
      return {
        success: false,
        errors: { userId: 'Passenger not found' },
      }
    }

    if (passenger.isSuspended) {
      return {
        success: false,
        errors: { userId: 'Account is suspended' },
      }
    }

    if (!passenger.isActive) {
      return {
        success: false,
        errors: { userId: 'Account is not active' },
      }
    }

    // Check for duplicate idempotency key
    const existingBooking = await prisma.booking.findUnique({
      where: { idempotencyKey: request.idempotencyKey },
    })

    if (existingBooking) {
      // Return existing booking
      const fareConfig = await prisma.fareConfig.findUnique({
        where: { id: existingBooking.fareConfigId! },
      })

      return {
        success: true,
        data: {
          bookingId: existingBooking.id,
          reference: existingBooking.reference,
          fareEstimate: Number(existingBooking.fareEstimate),
          fareType: existingBooking.fareType as 'ESTIMATED' | 'FIXED',
          distanceKm: 0, // Not stored separately
          breakdown: {
            baseFare: fareConfig ? Number(fareConfig.baseFare) : 0,
            distanceCharge: 0,
            total: Number(existingBooking.fareEstimate),
          },
        },
      }
    }

    // Validate coordinates
    if (
      !request.pickupLat ||
      !request.pickupLng ||
      !request.destinationLat ||
      !request.destinationLng
    ) {
      return {
        success: false,
        errors: { location: 'Valid pickup and destination coordinates are required' },
      }
    }

    // Get active service area
    const serviceArea = await prisma.serviceArea.findFirst({
      where: { isActive: true },
    })

    if (!serviceArea) {
      return {
        success: false,
        message: 'Service is currently unavailable in your area',
      }
    }

    // Validate locations are within service area
    const locationValidation = validateBookingLocations(
      request.pickupLat,
      request.pickupLng,
      request.destinationLat,
      request.destinationLng,
      serviceArea.boundary as any
    )

    if (!locationValidation.valid) {
      return {
        success: false,
        errors: { location: locationValidation.error! },
      }
    }

    // Get active fare config
    const fareConfig = await prisma.fareConfig.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    })

    if (!fareConfig) {
      return {
        success: false,
        message: 'Fare configuration not available',
      }
    }

    // Calculate fare
    const fareResult = calculateFare({
      pickupLat: request.pickupLat,
      pickupLng: request.pickupLng,
      destinationLat: request.destinationLat,
      destinationLng: request.destinationLng,
      serviceType: request.serviceType,
      fareConfig,
    })

    // Generate booking reference
    const today = new Date()
    const prefix = getTodayReferencePrefix()

    // Count today's bookings to get sequence number
    const todayBookingsCount = await prisma.booking.count({
      where: {
        reference: {
          startsWith: prefix,
        },
      },
    })

    const reference = generateBookingReference(today, todayBookingsCount + 1)

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        passengerId: passenger.id, // Use PatulodUser.id
        pickupAddress: request.pickupAddress,
        destinationAddress: request.destinationAddress,
        pickupLat: request.pickupLat,
        pickupLng: request.pickupLng,
        destinationLat: request.destinationLat,
        destinationLng: request.destinationLng,
        serviceType: request.serviceType,
        passengerCount: request.passengerCount,
        fareEstimate: fareResult.fare,
        fareType: fareResult.fareType,
        fareConfigId: fareConfig.id,
        paymentMethod: request.paymentMethod,
        status: 'SEARCHING',
        idempotencyKey: request.idempotencyKey,
      },
    })

    // Create initial booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: null,
        toStatus: 'SEARCHING',
        actorId: passenger.id, // Use PatulodUser.id
        actorRole: 'PASSENGER',
        reason: 'Booking created',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: passenger.id, // Use PatulodUser.id
        entity: 'Booking',
        action: 'CREATE',
        actorId: passenger.id, // Use PatulodUser.id
        actorRole: 'PASSENGER',
        metadata: {
          bookingId: booking.id,
          reference: booking.reference,
        },
      },
    })

    return {
      success: true,
      data: {
        bookingId: booking.id,
        reference: booking.reference,
        fareEstimate: fareResult.fare,
        fareType: fareResult.fareType,
        distanceKm: fareResult.distanceKm,
        breakdown: fareResult.breakdown,
      },
    }
  } catch (error) {
    console.error('Create booking error:', error)
    return {
      success: false,
      message: 'Failed to create booking',
    }
  }
}

/**
 * Confirm booking and start matching
 */
export async function confirmBooking(params: {
  bookingId: string
  userId: string
}): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  try {
    // Find PatulodUser by Better Auth userId
    const passenger = await prisma.patulodUser.findUnique({
      where: { userId: params.userId },
    })

    if (!passenger) {
      return {
        success: false,
        errors: { userId: 'Passenger not found' },
      }
    }

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
    })

    if (!booking) {
      return {
        success: false,
        errors: { bookingId: 'Booking not found' },
      }
    }

    // Use the PatulodUser.id (internal ID) for comparison
    if (booking.passengerId !== passenger.id) {
      return {
        success: false,
        errors: { userId: 'Unauthorized' },
      }
    }

    if (booking.status !== 'SEARCHING') {
      return {
        success: false,
        errors: { status: 'Booking is not in SEARCHING state' },
      }
    }

    // Create booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: 'SEARCHING',
        toStatus: 'SEARCHING',
        actorId: passenger.id, // Use internal PatulodUser.id
        actorRole: 'PASSENGER',
        reason: 'Booking confirmed, starting driver search',
      },
    })

    // Start matching process (async)
    await startMatching(booking.id)

    return {
      success: true,
      message: 'Searching for nearby drivers',
    }
  } catch (error) {
    console.error('Confirm booking error:', error)
    return {
      success: false,
      message: 'Failed to confirm booking',
    }
  }
}

/**
 * Get active booking for user
 */
export async function getActiveBooking(userId: string): Promise<{
  success: boolean
  data?: any
  message?: string
}> {
  try {
    // Find PatulodUser by Better Auth userId
    const passenger = await prisma.patulodUser.findUnique({
      where: { userId },
    })

    if (!passenger) {
      return {
        success: false,
        message: 'Passenger not found',
      }
    }

    const booking = await prisma.booking.findFirst({
      where: {
        passengerId: passenger.id, // Use internal PatulodUser.id
        status: {
          in: ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'],
        },
      },
      include: {
        trip: {
          include: {
            driver: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!booking) {
      return {
        success: false,
        message: 'No active booking found',
      }
    }

    return {
      success: true,
      data: booking,
    }
  } catch (error) {
    console.error('Get active booking error:', error)
    return {
      success: false,
      message: 'Failed to get active booking',
    }
  }
}

/**
 * Cancel booking
 */
export async function cancelBooking(params: {
  bookingId: string
  userId: string
  initiator: 'PASSENGER' | 'DRIVER'
  reason?: string
}): Promise<{ success: boolean; message?: string; errors?: Record<string, string> }> {
  try {
    console.log('🔴 Cancel booking request:', {
      bookingId: params.bookingId,
      userId: params.userId,
      initiator: params.initiator,
    });

    // Find PatulodUser if initiator is PASSENGER
    let internalUserId = params.userId
    if (params.initiator === 'PASSENGER') {
      const passenger = await prisma.patulodUser.findUnique({
        where: { userId: params.userId },
      })
      console.log('🔍 Found passenger:', passenger?.id);
      
      if (!passenger) {
        return {
          success: false,
          errors: { userId: 'Passenger not found' },
        }
      }
      internalUserId = passenger.id
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        trip: true,
      },
    })

    console.log('🔍 Found booking:', {
      id: booking?.id,
      status: booking?.status,
      passengerId: booking?.passengerId,
    });

    if (!booking) {
      return {
        success: false,
        errors: { bookingId: 'Booking not found' },
      }
    }

    // Verify user authorization (using internal IDs)
    if (params.initiator === 'PASSENGER' && booking.passengerId !== internalUserId) {
      console.log('❌ Authorization failed:', {
        bookingPassengerId: booking.passengerId,
        internalUserId,
      });
      return {
        success: false,
        errors: { userId: 'Unauthorized' },
      }
    }

    if (params.initiator === 'DRIVER' && booking.trip?.driverId !== internalUserId) {
      return {
        success: false,
        errors: { userId: 'Unauthorized' },
      }
    }

    // Check if cancellation is allowed
    const cancellationCheck = isCancellationAllowed(booking.status, params.initiator)

    console.log('🔍 Cancellation check:', cancellationCheck);

    if (!cancellationCheck.allowed) {
      return {
        success: false,
        errors: { status: cancellationCheck.reason! },
      }
    }

    // Get cancellation fees from config
    const [feeBeforeConfig, feeAfterConfig, feeDriverConfig] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { key: 'cancellation_fee_passenger_before_assignment' },
      }),
      prisma.systemConfig.findUnique({
        where: { key: 'cancellation_fee_passenger_after_assignment' },
      }),
      prisma.systemConfig.findUnique({
        where: { key: 'cancellation_fee_driver_after_acceptance' },
      }),
    ])

    const feeCalc = calculateCancellationFee({
      currentStatus: booking.status,
      initiator: params.initiator,
      feeBeforeAssignment: Number(feeBeforeConfig?.value || 0),
      feeAfterAssignment: Number(feeAfterConfig?.value || 0),
      feeDriverAfterAcceptance: Number(feeDriverConfig?.value || 0),
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: params.bookingId },
      data: {
        status: 'CANCELLED',
      },
    })

    // Create booking event
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: 'CANCELLED',
        actorId: internalUserId, // Use internal ID
        actorRole: params.initiator,
        reason: params.reason || `Cancelled by ${params.initiator.toLowerCase()}. ${feeCalc.reason}`,
      },
    })

    // Update trip if exists
    if (booking.trip) {
      await prisma.trip.update({
        where: { id: booking.trip.id },
        data: {
          cancellationReason: params.reason || 'Cancelled',
          cancellationInitiator: params.initiator,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: internalUserId, // Use internal ID
        entity: 'Booking',
        action: 'CANCEL',
        actorId: internalUserId, // Use internal ID
        actorRole: params.initiator,
        metadata: {
          bookingId: booking.id,
          reference: booking.reference,
          cancellationFee: feeCalc.fee,
        },
      },
    })

    return {
      success: true,
      message: `Booking cancelled. ${feeCalc.reason}`,
    }
  } catch (error) {
    console.error('Cancel booking error:', error)
    return {
      success: false,
      message: 'Failed to cancel booking',
    }
  }
}

/**
 * Driver accepts booking (atomic operation)
 */
export async function acceptBooking(params: {
  bookingId: string
  driverId: string
}): Promise<{ success: boolean; data?: any; message?: string; errors?: Record<string, string> }> {
  try {
    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Lock the booking row
      const booking = await tx.booking.findUnique({
        where: { id: params.bookingId },
        include: {
          passenger: true,
        },
      })

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (booking.status !== 'SEARCHING') {
        throw new Error('Booking is no longer available')
      }

      // Verify driver is approved and online
      const driver = await tx.patulodUser.findUnique({
        where: { id: params.driverId },
        include: {
          driverAvailability: true,
        },
      })

      if (!driver || driver.role !== 'DRIVER') {
        throw new Error('Driver not found')
      }

      if (driver.isSuspended) {
        throw new Error('Driver account is suspended')
      }

      if (!driver.driverAvailability?.isOnline) {
        throw new Error('Driver is not online')
      }

      // Check if driver has active ride
      const activeRide = await tx.trip.findFirst({
        where: {
          driverId: params.driverId,
          booking: {
            status: {
              in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'],
            },
          },
        },
      })

      if (activeRide) {
        throw new Error('Driver already has an active ride')
      }

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: params.bookingId },
        data: {
          status: 'DRIVER_ASSIGNED',
        },
      })

      // Create trip record
      const trip = await tx.trip.create({
        data: {
          bookingId: booking.id,
          driverId: params.driverId,
          passengerId: booking.passengerId,
        },
      })

      // Create booking event
      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          fromStatus: 'SEARCHING',
          toStatus: 'DRIVER_ASSIGNED',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          reason: 'Driver accepted booking',
        },
      })

      // Create trip event
      await tx.tripEvent.create({
        data: {
          tripId: trip.id,
          fromStatus: null,
          toStatus: 'DRIVER_ASSIGNED',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          reason: 'Trip assigned to driver',
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: params.driverId,
          entity: 'Booking',
          action: 'ACCEPT',
          actorId: params.driverId,
          actorRole: 'DRIVER',
          metadata: {
            bookingId: booking.id,
            tripId: trip.id,
          },
        },
      })

      return { booking: updatedBooking, trip, driver, passenger: booking.passenger }
    })

    // TODO: Emit Socket.IO event booking:driver_assigned

    return {
      success: true,
      data: result,
      message: 'Booking accepted successfully',
    }
  } catch (error: any) {
    console.error('Accept booking error:', error)
    return {
      success: false,
      message: error.message || 'Failed to accept booking',
    }
  }
}

/**
 * Driver declines booking
 */
export async function declineBooking(params: {
  bookingId: string
  driverId: string
  reason?: string
}): Promise<{ success: boolean; message?: string }> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
    })

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found',
      }
    }

    // Create booking event for decline
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: booking.status, // Status doesn't change
        actorId: params.driverId,
        actorRole: 'DRIVER',
        reason: params.reason || 'Driver declined booking',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: params.driverId,
        entity: 'Booking',
        action: 'DECLINE',
        actorId: params.driverId,
        actorRole: 'DRIVER',
        metadata: {
          bookingId: booking.id,
          reason: params.reason,
        },
      },
    })

    // TODO: Return booking to matching pool (continue matching with other drivers)

    return {
      success: true,
      message: 'Booking declined',
    }
  } catch (error) {
    console.error('Decline booking error:', error)
    return {
      success: false,
      message: 'Failed to decline booking',
    }
  }
}
