import { useNavigate } from '@tanstack/react-router'

export type BookingStatusFilter =
  | 'ALL'
  | 'SEARCHING'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_DRIVER_FOUND'

export interface BookingRow {
  id: string
  reference: string
  status: string
  fareEstimate: string | number
  serviceType: string
  createdAt: string
  // joined
  passengerName?: string
  driverName?: string
  pickupAddress: string
  destinationAddress: string
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

const STATUSES: BookingStatusFilter[] = [
  'ALL', 'SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED',
  'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_DRIVER_FOUND',
]

interface BookingsTableProps {
  rows: BookingRow[]
  total: number
  page: number
  perPage: number
  isLoading: boolean
  statusFilter: BookingStatusFilter
  onStatusChange: (s: BookingStatusFilter) => void
  onPageChange: (p: number) => void
}

export function BookingsTable({
  rows, total, page, perPage, isLoading,
  statusFilter, onStatusChange, onPageChange,
}: BookingsTableProps) {
  const navigate = useNavigate()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return (
    <div className="space-y-3">
      {/* Status filter tabs */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-3">
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={`btn btn-xs ${
                  statusFilter === s ? 'btn-primary' : 'btn-ghost border border-base-300'
                }`}
              >
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>Reference</th>
                <th>Passenger</th>
                <th>Driver</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Fare</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: perPage }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j}><div className="h-3 skeleton rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : rows.map((b) => (
                    <tr key={b.id} className="hover:bg-base-100 transition-colors">
                      <td className="font-mono font-medium">{b.reference}</td>
                      <td>{b.passengerName ?? '—'}</td>
                      <td>{b.driverName ?? '—'}</td>
                      <td className="max-w-[160px] truncate text-base-content/60">{b.pickupAddress}</td>
                      <td className="max-w-[160px] truncate text-base-content/60">{b.destinationAddress}</td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE[b.status] ?? 'badge-ghost'}`}>
                          {b.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="font-medium">₱{Number(b.fareEstimate).toFixed(2)}</td>
                      <td className="text-base-content/60">
                        {new Date(b.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-primary btn-outline"
                          onClick={() => navigate({ to: `/bookings/${b.id}` })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-3 py-2 border-t border-base-300 bg-base-200">
          <span className="text-xs text-base-content/60">
            {isLoading ? 'Loading…' : `Showing ${total === 0 ? 0 : start + 1}–${Math.min(start + perPage, total)} of ${total}`}
          </span>
          <div className="join">
            <button className="join-item btn btn-xs" onClick={() => onPageChange(page - 1)} disabled={page === 1 || isLoading}>«</button>
            <button className="join-item btn btn-xs btn-disabled">Page {page} of {totalPages}</button>
            <button className="join-item btn btn-xs" onClick={() => onPageChange(page + 1)} disabled={page === totalPages || isLoading}>»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
