import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface BookingEvent {
  id: string
  fromStatus: string | null
  toStatus: string
  actorRole: string | null
  reason: string | null
  timestamp: string
}

const STATUS_COLOR: Record<string, string> = {
  SEARCHING:       'bg-warning',
  DRIVER_ASSIGNED: 'bg-primary',
  DRIVER_ARRIVED:  'bg-primary',
  IN_PROGRESS:     'bg-info',
  COMPLETED:       'bg-success',
  CANCELLED:       'bg-error',
  NO_DRIVER_FOUND: 'bg-error',
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ')
}

export function BookingTimeline({ bookingId }: { bookingId: string }) {
  const { data: events, isLoading, isError } = useQuery<BookingEvent[]>({
    queryKey: ['booking', bookingId, 'events'],
    queryFn: () =>
      prismaQuery<BookingEvent[]>({
        model: 'bookingEvent',
        operation: 'findMany',
        args: {
          where: { bookingId },
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            actorRole: true,
            reason: true,
            timestamp: true,
          },
        },
      }),
    staleTime: 30_000,
  })

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-primary mb-2">Trip Timeline</h2>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-3 h-3 skeleton rounded-full mt-1 shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 skeleton rounded w-1/3" />
                  <div className="h-2 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-error/70">Failed to load timeline.</p>
        )}

        {!isLoading && events?.length === 0 && (
          <p className="text-xs text-base-content/50 py-4 text-center">
            No events recorded yet.
          </p>
        )}

        {!isLoading && events && events.length > 0 && (
          <div className="space-y-0">
            {events.map((e, idx) => (
              <div key={e.id} className="flex gap-3">
                {/* timeline dot + line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${STATUS_COLOR[e.toStatus] ?? 'bg-base-300'}`} />
                  {idx < events.length - 1 && (
                    <div className="w-px flex-1 bg-base-300 my-1" />
                  )}
                </div>

                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">
                    {e.fromStatus
                      ? <>{statusLabel(e.fromStatus)} <span className="text-base-content/40">→</span> {statusLabel(e.toStatus)}</>
                      : statusLabel(e.toStatus)
                    }
                  </p>
                  {e.reason && (
                    <p className="text-xs text-base-content/60 mt-0.5">{e.reason}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <p className="text-xs text-base-content/40">
                      {new Date(e.timestamp).toLocaleString('en-US', {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                    {e.actorRole && (
                      <span className="text-xs text-base-content/40">· {e.actorRole}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
