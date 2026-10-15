import type { RideStatus } from '../../../prisma/generated/client'

/**
 * Calculate cancellation fee based on booking status and who initiated
 */
export function calculateCancellationFee(params: {
  currentStatus: RideStatus
  initiator: 'PASSENGER' | 'DRIVER'
  feeBeforeAssignment: number
  feeAfterAssignment: number
  feeDriverAfterAcceptance: number
}): {
  fee: number
  reason: string
} {
  const {
    currentStatus,
    initiator,
    feeBeforeAssignment,
    feeAfterAssignment,
    feeDriverAfterAcceptance,
  } = params

  // Passenger cancellation
  if (initiator === 'PASSENGER') {
    // Before driver assigned - no fee or minimal fee
    if (currentStatus === 'SEARCHING') {
      return {
        fee: feeBeforeAssignment,
        reason:
          feeBeforeAssignment > 0
            ? 'Cancellation fee for booking cancellation'
            : 'No cancellation fee - cancelled before driver assignment',
      }
    }

    // After driver assigned - higher fee
    if (
      currentStatus === 'DRIVER_ASSIGNED' ||
      currentStatus === 'DRIVER_ARRIVED' ||
      currentStatus === 'IN_PROGRESS'
    ) {
      return {
        fee: feeAfterAssignment,
        reason: 'Cancellation fee - driver already assigned',
      }
    }
  }

  // Driver cancellation
  if (initiator === 'DRIVER') {
    // Driver should not be charged for declining before acceptance
    // Only after acceptance (DRIVER_ASSIGNED onwards)
    if (
      currentStatus === 'DRIVER_ASSIGNED' ||
      currentStatus === 'DRIVER_ARRIVED' ||
      currentStatus === 'IN_PROGRESS'
    ) {
      return {
        fee: feeDriverAfterAcceptance,
        reason:
          feeDriverAfterAcceptance > 0
            ? 'Cancellation penalty for driver'
            : 'Driver cancellation recorded',
      }
    }
  }

  // No fee for other cases
  return {
    fee: 0,
    reason: 'No cancellation fee applicable',
  }
}

/**
 * Check if cancellation is allowed at current booking status
 */
export function isCancellationAllowed(
  currentStatus: RideStatus,
  initiator: 'PASSENGER' | 'DRIVER'
): { allowed: boolean; reason?: string } {
  console.log('🔍 Checking cancellation:', { currentStatus, initiator });

  // Cannot cancel completed or already cancelled bookings
  if (currentStatus === 'COMPLETED') {
    return {
      allowed: false,
      reason: 'Cannot cancel a completed trip',
    }
  }

  if (currentStatus === 'CANCELLED') {
    return {
      allowed: false,
      reason: 'Booking is already cancelled',
    }
  }

  // Passenger can cancel at any time before completion
  if (initiator === 'PASSENGER') {
    if (
      currentStatus === 'SEARCHING' ||
      currentStatus === 'DRIVER_ASSIGNED' ||
      currentStatus === 'DRIVER_ARRIVED'
    ) {
      console.log('✅ Passenger cancellation allowed');
      return { allowed: true }
    }

    // Cannot cancel once trip is in progress
    if (currentStatus === 'IN_PROGRESS') {
      return {
        allowed: false,
        reason: 'Cannot cancel a trip in progress. Please complete the trip or contact support.',
      }
    }
    
    // Handle NO_DRIVER_FOUND status
    if (currentStatus === 'NO_DRIVER_FOUND') {
      console.log('✅ Passenger cancellation allowed (NO_DRIVER_FOUND)');
      return { allowed: true }
    }
  }

  // Driver can cancel before starting trip
  if (initiator === 'DRIVER') {
    if (currentStatus === 'DRIVER_ASSIGNED' || currentStatus === 'DRIVER_ARRIVED') {
      return { allowed: true }
    }

    // Cannot cancel once trip started
    if (currentStatus === 'IN_PROGRESS') {
      return {
        allowed: false,
        reason: 'Cannot cancel a trip in progress',
      }
    }

    // Driver shouldn't be cancelling SEARCHING bookings (they haven't accepted yet)
    if (currentStatus === 'SEARCHING') {
      return {
        allowed: false,
        reason: 'Booking not assigned to driver',
      }
    }
  }

  console.log('❌ Cancellation not allowed:', { currentStatus, initiator });
  return {
    allowed: false,
    reason: `Cancellation not allowed at this stage (status: ${currentStatus})`,
  }
}
