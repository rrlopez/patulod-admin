import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface AuditLogEntry {
  id: string
  entity: string
  action: string
  actorRole: string | null
  metadata: Record<string, unknown> | null
  timestamp: string
}

/** Maps entity+action pairs to a human-readable message and icon */
function formatEntry(log: AuditLogEntry): { icon: string; message: string } {
  const meta = log.metadata ?? {}
  const name = (meta.fullName ?? meta.name ?? meta.email ?? '') as string

  switch (`${log.entity}:${log.action}`) {
    case 'Booking:CREATE':
      return { icon: '📋', message: `New booking created${name ? ` by ${name}` : ''}` }
    case 'Booking:COMPLETED':
      return { icon: '✅', message: `Trip completed${name ? ` — ${name}` : ''}` }
    case 'Booking:CANCELLED':
      return { icon: '❌', message: `Booking cancelled${name ? ` by ${name}` : ''}` }
    case 'DriverApplication:APPLY':
      return { icon: '📄', message: `New driver application${name ? ` from ${name}` : ''}` }
    case 'DriverApplication:APPROVED':
      return { icon: '🚗', message: `Driver application approved${name ? ` — ${name}` : ''}` }
    case 'DriverApplication:REJECTED':
      return { icon: '🚫', message: `Driver application rejected${name ? ` — ${name}` : ''}` }
    case 'PatulodUser:LOGIN':
      return { icon: '🔑', message: `User logged in${name ? ` — ${name}` : ''}` }
    case 'PatulodUser:LOGOUT':
      return { icon: '👋', message: `User logged out${name ? ` — ${name}` : ''}` }
    case 'PatulodUser:CREATE':
      return { icon: '👤', message: `New user registered${name ? ` — ${name}` : ''}` }
    case 'SupportCase:CREATE':
      return { icon: '💬', message: `New support case opened${name ? ` by ${name}` : ''}` }
    case 'SupportCase:CLOSED':
      return { icon: '✔️', message: `Support case closed${name ? ` — ${name}` : ''}` }
    default:
      return {
        icon: '📝',
        message: `${log.entity} ${log.action.toLowerCase()}${name ? ` — ${name}` : ''}`,
      }
  }
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function RecentActivity() {
  const { data: logs, isLoading, isError } = useQuery<AuditLogEntry[]>({
    queryKey: ['dashboard', 'recentActivity'],
    queryFn: () =>
      prismaQuery<AuditLogEntry[]>({
        model: 'auditLog',
        operation: 'findMany',
        args: {
          orderBy: { timestamp: 'desc' },
          take: 10,
          select: {
            id: true,
            entity: true,
            action: true,
            actorRole: true,
            metadata: true,
            timestamp: true,
          },
        },
      }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm h-full">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-primary">Recent Activity</h2>
          <span className="text-xs text-base-content/40">Live • 1 min refresh</span>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-base-100">
                <div className="w-8 h-8 skeleton rounded-lg shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 skeleton rounded w-3/4" />
                  <div className="h-2 skeleton rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-xs text-error/70 text-center py-4">
            Failed to load activity. Will retry automatically.
          </div>
        )}

        {!isLoading && !isError && logs?.length === 0 && (
          <div className="text-xs text-base-content/40 text-center py-6">
            No activity yet.
          </div>
        )}

        {!isLoading && logs && logs.length > 0 && (
          <div className="space-y-2">
            {logs.map((log) => {
              const { icon, message } = formatEntry(log)
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-base-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-base">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-base-content truncate">{message}</p>
                    <p className="text-xs text-base-content/50 mt-0.5">{timeAgo(log.timestamp)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
