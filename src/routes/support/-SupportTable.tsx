import { useNavigate } from '@tanstack/react-router'

export type SupportStatusFilter = 'ALL' | 'RECEIVED' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'CLOSED'
export type SupportTypeFilter = 'ALL' | 'DISPUTE' | 'REPORT' | 'LOST_BELONGINGS' | 'INCIDENT'

export interface SupportCaseRow {
  id: string
  type: string
  category: string | null
  status: string
  description: string
  createdAt: string
  // joined
  reporterName?: string
}

const STATUS_BADGE: Record<string, string> = {
  RECEIVED:     'badge-warning',
  UNDER_REVIEW: 'badge-info',
  ACTION_TAKEN: 'badge-primary',
  CLOSED:       'badge-ghost',
}

const TYPE_BADGE: Record<string, string> = {
  DISPUTE:         'badge-error',
  REPORT:          'badge-warning',
  LOST_BELONGINGS: 'badge-info',
  INCIDENT:        'badge-error',
}

const STATUSES: SupportStatusFilter[] = ['ALL', 'RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'CLOSED']
const TYPES: SupportTypeFilter[] = ['ALL', 'DISPUTE', 'REPORT', 'LOST_BELONGINGS', 'INCIDENT']

interface SupportTableProps {
  rows: SupportCaseRow[]
  total: number
  page: number
  perPage: number
  isLoading: boolean
  statusFilter: SupportStatusFilter
  typeFilter: SupportTypeFilter
  onStatusChange: (s: SupportStatusFilter) => void
  onTypeChange: (t: SupportTypeFilter) => void
  onPageChange: (p: number) => void
}

export function SupportTable({
  rows, total, page, perPage, isLoading,
  statusFilter, typeFilter, onStatusChange, onTypeChange, onPageChange,
}: SupportTableProps) {
  const navigate = useNavigate()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-3 space-y-2">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-base-content/50 mr-1">Status:</span>
            {STATUSES.map((s) => (
              <button key={s} onClick={() => onStatusChange(s)}
                className={`btn btn-xs ${statusFilter === s ? 'btn-primary' : 'btn-ghost border border-base-300'}`}>
                {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-base-content/50 mr-1">Type:</span>
            {TYPES.map((t) => (
              <button key={t} onClick={() => onTypeChange(t)}
                className={`btn btn-xs ${typeFilter === t ? 'btn-secondary' : 'btn-ghost border border-base-300'}`}>
                {t === 'ALL' ? 'All' : t.replace(/_/g, ' ')}
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
                <th>Reporter</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: perPage }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j}><div className="h-3 skeleton rounded w-full" /></td>
                      ))}
                    </tr>
                  ))
                : rows.map((c) => (
                    <tr key={c.id} className="hover:bg-base-100 transition-colors">
                      <td className="font-medium">{c.reporterName ?? '—'}</td>
                      <td>
                        <span className={`badge badge-sm ${TYPE_BADGE[c.type] ?? 'badge-ghost'}`}>
                          {c.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {c.category
                          ? <span className="badge badge-sm badge-outline">{c.category}</span>
                          : <span className="text-base-content/40">—</span>}
                      </td>
                      <td className="max-w-[220px] truncate text-base-content/70">
                        {c.description}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE[c.status] ?? 'badge-ghost'}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="text-base-content/60">
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-primary btn-outline"
                          onClick={() => navigate({ to: `/support/${c.id}` })}
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
