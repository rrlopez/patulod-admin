import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

export interface BookingDetail {
  id: string
  reference: string
  status: string
  pickupAddress: string
  destinationAddress: string
  serviceType: string
  passengerCount: number
  fareEstimate: string | number
  fareType: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
  // joined relations
  passenger: { id: string; fullName: string; phone: string } | null
  trip: {
    id: string
    startedAt: string | null
    completedAt: string | null
    finalFare: string | number | null
    cancellationReason: string | null
    cancellationInitiator: string | null
    driver: { id: string; fullName: string; phone: string } | null
  } | null
}

const STATUS_BADGE: Record<string, string> = {
  SEARCHING:       'badge-warning',
  DRIVER_ASSIGNED: 'badge-primary',
  DRIVER_ARRIVED:  'badge-primary',
  IN_PROGRESS:     'badge-info',
  COMPLETED:       'badge-success',
  CANCELLED:       'badge-error',
  NO_DRIVER_FOUND: 'badge-error',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-base-content/60 mb-0.5">{label}</p>
      <div className="font-medium text-sm">{children}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body space-y-3">
        <div className="h-4 skeleton rounded w-1/4" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-3 skeleton rounded" />)}
        </div>
      </div>
    </div>
  )
}

export function BookingInfo({ bookingId }: { bookingId: string }) {
  const { data: booking, isLoading, isError } = useQuery<BookingDetail>({
    queryKey: ['booking', bookingId, 'info'],
    queryFn: () =>
      prismaQuery<BookingDetail>({
        model: 'booking',
        operation: 'findUnique',
        args: {
          where: { id: bookingId },
          include: {
            passenger: { select: { id: true, fullName: true, phone: true } },
            trip: {
              select: {
                id: true,
                startedAt: true,
                completedAt: true,
                finalFare: true,
                cancellationReason: true,
                cancellationInitiator: true,
                driver: { select: { id: true, fullName: true, phone: true } },
              },
            },
          },
        },
      }),
    staleTime: 30_000,
  })

  if (isLoading) return <SkeletonCard />

  if (isError || !booking) {
    return <div className="alert alert-error"><span>Failed to load booking details.</span></div>
  }

  const finalFare = booking.trip?.finalFare ?? booking.fareEstimate

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <h2 className="card-title text-primary">Trip Information</h2>
          <span className={`badge ${STATUS_BADGE[booking.status] ?? 'badge-ghost'}`}>
            {booking.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Passenger">
            {booking.passenger
              ? <span>{booking.passenger.fullName} <span className="text-base-content/50 font-mono text-xs">({booking.passenger.phone})</span></span>
              : '—'}
          </Field>

          <Field label="Driver">
            {booking.trip?.driver
              ? <span>{booking.trip.driver.fullName} <span className="text-base-content/50 font-mono text-xs">({booking.trip.driver.phone})</span></span>
              : '—'}
          </Field>

          <div className="col-span-2">
            <Field label="Pickup">{booking.pickupAddress}</Field>
          </div>

          <div className="col-span-2">
            <Field label="Destination">{booking.destinationAddress}</Field>
          </div>

          <Field label="Service Type">
            <span className="capitalize">{booking.serviceType}</span>
          </Field>

          <Field label="Passengers">{booking.passengerCount}</Field>

          <Field label="Fare">
            <span className="text-lg">
              ₱{Number(finalFare).toFixed(2)}
              {booking.trip?.finalFare && booking.trip.finalFare !== booking.fareEstimate && (
                <span className="text-xs text-base-content/50 ml-1">(est. ₱{Number(booking.fareEstimate).toFixed(2)})</span>
              )}
            </span>
          </Field>

          <Field label="Payment">{booking.paymentMethod}</Field>

          <Field label="Created">
            {new Date(booking.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </Field>

          {booking.trip?.startedAt && (
            <Field label="Started">
              {new Date(booking.trip.startedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </Field>
          )}

          {booking.trip?.completedAt && (
            <Field label="Completed">
              {new Date(booking.trip.completedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}
            </Field>
          )}
        </div>

        {booking.trip?.cancellationReason && (
          <div className="mt-3 pt-3 border-t border-base-300">
            <p className="text-xs text-base-content/60 mb-1">Cancellation Reason</p>
            <div className="alert alert-error text-xs py-2">
              {booking.trip.cancellationReason}
              {booking.trip.cancellationInitiator && (
                <span className="ml-2 opacity-60">— by {booking.trip.cancellationInitiator}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
