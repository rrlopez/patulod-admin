import { useNavigate } from '@tanstack/react-router'
import { formatDate } from '../../lib/date-format'

export type DriverStatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'DOCUMENTS_NEEDED' | 'SUSPENDED' | 'INACTIVE'

export interface ApplicationRow {
  id: string
  fullName: string
  email: string
  phone: string
  vehicleType: string
  plateNumber: string
  status: string
  submittedAt: string
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'badge-warning',
  IN_PROGRESS:      'badge-info',
  APPROVED:         'badge-success',
  REJECTED:         'badge-error',
  DOCUMENTS_NEEDED: 'badge-info',
  SUSPENDED:        'badge-warning',
  INACTIVE:         'badge-ghost',
}

interface DriversTableProps {
  rows: ApplicationRow[]
  total: number
  page: number
  perPage: number
  isLoading: boolean
  statusFilter: DriverStatusFilter
  onStatusChange: (s: DriverStatusFilter) => void
  onPageChange: (p: number) => void
}

const STATUSES: DriverStatusFilter[] = ['ALL', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'DOCUMENTS_NEEDED', 'SUSPENDED', 'INACTIVE']

export function DriversTable({
  rows,
  total,
  page,
  perPage,
  isLoading,
  statusFilter,
  onStatusChange,
  onPageChange,
}: DriversTableProps) {
  const navigate = useNavigate()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return (
    <div className="space-y-3">
      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1">
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

      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Status</th>
                <th>Applied</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: perPage }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j}><div className="h-3 skeleton rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : rows.map((app) => (
                    <tr key={app.id} className="hover:bg-base-100 transition-colors">
                      <td className="font-medium">{app.fullName}</td>
                      <td className="text-base-content/60">{app.email}</td>
                      <td className="font-mono text-base-content/60">{app.phone}</td>
                      <td className="capitalize">{app.vehicleType.toLowerCase()}</td>
                      <td className="font-mono font-bold">{app.plateNumber}</td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE[app.status] ?? 'badge-ghost'}`}>
                          {app.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-base-content/60">
                        {formatDate(app.submittedAt)}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-primary btn-outline"
                          onClick={() => navigate({ to: `/drivers/${app.id}` })}
                        >
                          Review
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
