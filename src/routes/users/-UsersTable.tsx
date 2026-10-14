import { useNavigate } from '@tanstack/react-router'

export interface UserRow {
  id: string
  fullName: string
  phone: string
  role: string
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  // joined from Better Auth user
  email?: string
}

interface UsersTableProps {
  rows: UserRow[]
  total: number
  page: number
  perPage: number
  isLoading: boolean
  onPageChange: (page: number) => void
  sortField: keyof UserRow
  sortDir: 'asc' | 'desc'
  onSort: (field: keyof UserRow) => void
}

function statusBadge(user: UserRow) {
  if (user.isSuspended) return 'badge-warning'
  if (!user.isActive) return 'badge-error'
  return 'badge-success'
}

function statusLabel(user: UserRow) {
  if (user.isSuspended) return 'SUSPENDED'
  if (!user.isActive) return 'INACTIVE'
  return 'ACTIVE'
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: string
  sortField: string
  sortDir: 'asc' | 'desc'
}) {
  if (field !== sortField) return null
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export function UsersTable({
  rows,
  total,
  page,
  perPage,
  isLoading,
  onPageChange,
  sortField,
  sortDir,
  onSort,
}: UsersTableProps) {
  const navigate = useNavigate()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead className="bg-base-300 text-primary">
            <tr>
              <th className="cursor-pointer select-none" onClick={() => onSort('fullName')}>
                Name <SortIcon field="fullName" sortField={sortField} sortDir={sortDir} />
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th className="cursor-pointer select-none" onClick={() => onSort('role')}>
                Role <SortIcon field="role" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="cursor-pointer select-none" onClick={() => onSort('isSuspended')}>
                Status <SortIcon field="isSuspended" sortField={sortField} sortDir={sortDir} />
              </th>
              <th className="cursor-pointer select-none" onClick={() => onSort('createdAt')}>
                Joined <SortIcon field="createdAt" sortField={sortField} sortDir={sortDir} />
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: perPage }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-3 skeleton rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((u) => (
                  <tr key={u.id} className="hover:bg-base-100 transition-colors">
                    <td className="font-medium">{u.fullName}</td>
                    <td className="text-base-content/60">{u.email ?? '—'}</td>
                    <td className="font-mono text-base-content/60">{u.phone}</td>
                    <td>
                      <span
                        className={`badge badge-sm badge-outline ${
                          u.role === 'DRIVER' ? 'badge-secondary' : 'badge-primary'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${statusBadge(u)}`}>
                        {statusLabel(u)}
                      </span>
                    </td>
                    <td className="text-base-content/60">
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td>
                      <button
                        className="btn btn-xs btn-primary btn-outline"
                        onClick={() => navigate({ to: `/users/${u.id}` })}
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
          {isLoading
            ? 'Loading…'
            : `Showing ${total === 0 ? 0 : start + 1}–${Math.min(start + perPage, total)} of ${total}`}
        </span>
        <div className="join">
          <button
            className="join-item btn btn-xs"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || isLoading}
          >
            «
          </button>
          <button className="join-item btn btn-xs btn-disabled">
            Page {page} of {totalPages}
          </button>
          <button
            className="join-item btn btn-xs"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || isLoading}
          >
            »
          </button>
        </div>
      </div>
    </div>
  )
}
