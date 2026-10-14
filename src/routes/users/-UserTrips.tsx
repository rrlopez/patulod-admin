import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface Booking {
  id: string
  reference: string
  pickupAddress: string
  destinationAddress: string
  status: string
  fareEstimate: string | number
  createdAt: string
}

const statusCls: Record<string, string> = {
  COMPLETED:       'badge-success',
  CANCELLED:       'badge-error',
  IN_PROGRESS:     'badge-info',
  DRIVER_ASSIGNED: 'badge-primary',
  DRIVER_ARRIVED:  'badge-primary',
  SEARCHING:       'badge-warning',
  NO_DRIVER_FOUND: 'badge-error',
}

export function UserTrips({ userId }: { userId: string }) {
  const { data: bookings, isLoading, isError } = useQuery<Booking[]>({
    queryKey: ['user', userId, 'trips'],
    queryFn: () =>
      prismaQuery<Booking[]>({
        model: 'booking',
        operation: 'findMany',
        args: {
          where: { passengerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            reference: true,
            pickupAddress: true,
            destinationAddress: true,
            status: true,
            fareEstimate: true,
            createdAt: true,
          },
        },
      }),
    staleTime: 30_000,
  })

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm mt-4">
      <div className="card-body">
        <h2 className="card-title text-primary">Recent Trips</h2>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-base-100 rounded-lg border border-base-300 space-y-2">
                <div className="h-3 skeleton rounded w-1/3" />
                <div className="h-3 skeleton rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-error/70 py-2">Failed to load trips.</p>
        )}

        {!isLoading && bookings?.length === 0 && (
          <p className="text-center text-base-content/60 py-4">No trips found</p>
        )}

        {!isLoading && bookings && bookings.length > 0 && (
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="p-3 bg-base-100 rounded-lg border border-base-300">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-sm font-medium">{b.reference}</span>
                  <span className={`badge badge-sm ${statusCls[b.status] ?? 'badge-ghost'}`}>
                    {b.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 truncate">
                  {b.pickupAddress} → {b.destinationAddress}
                </p>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-base-content/50">
                    {new Date(b.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                  <span className="text-sm font-medium">
                    ₱{Number(b.fareEstimate).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
