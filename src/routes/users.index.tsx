import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockUsers, type MockUser, type UserRole, type UserStatus } from '../mock/users'

export const Route = createFileRoute('/users/')({
  component: Users,
})

const statusBadge: Record<UserStatus, string> = {
  ACTIVE: 'badge-success',
  SUSPENDED: 'badge-warning',
  DELETED: 'badge-error',
}

const roleBadge: Record<UserRole, string> = {
  RIDER: 'badge-primary',
  DRIVER: 'badge-secondary',
  ADMIN: 'badge-neutral',
}

function Users() {
  return (
    <ProtectedRoute>
      <UsersContent />
    </ProtectedRoute>
  )
}

function UsersContent() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL')
  const [sortField, setSortField] = useState<keyof MockUser>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = mockUsers.filter((u) => {
    const s = search.toLowerCase()
    const matchSearch =
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.phone.includes(s)
    return matchSearch && (roleFilter === 'ALL' || u.role === roleFilter)
  })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortField]
    const bv = b[sortField]
    if (av === undefined) return 1
    if (bv === undefined) return -1
    return av < bv
      ? sortDir === 'asc'
        ? -1
        : 1
      : av > bv
        ? sortDir === 'asc'
          ? 1
          : -1
        : 0
  })

  const totalPages = Math.ceil(sorted.length / perPage)
  const start = (page - 1) * perPage
  const rows = sorted.slice(start, start + perPage)

  const handleSort = (f: keyof MockUser) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(f)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: keyof MockUser }) =>
    sortField === field ? (
      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Users & Accounts</h1>
        <p className="text-xs text-base-content/60">
          Manage passenger and driver accounts
        </p>
      </div>

      {/* Filters */}
      <div className="card bg-base-200 border border-base-300 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
            <label className="input input-bordered input-sm flex items-center gap-2 flex-1 md:max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone…"
                className="grow"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['ALL', 'RIDER', 'DRIVER'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r)
                    setPage(1)
                  }}
                  className={`btn btn-xs ${
                    roleFilter === r
                      ? r === 'DRIVER'
                        ? 'btn-secondary'
                        : 'btn-primary'
                      : 'btn-ghost border border-base-300'
                  }`}
                >
                  {r === 'ALL'
                    ? 'All Roles'
                    : r.charAt(0) + r.slice(1).toLowerCase() + 's'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </th>
                <th>Email</th>
                <th>Phone</th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('role')}
                >
                  Role <SortIcon field="role" />
                </th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('status')}
                >
                  Status <SortIcon field="status" />
                </th>
                <th>Trips</th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  Joined <SortIcon field="createdAt" />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-base-100 transition-colors">
                  <td className="font-medium">{u.name}</td>
                  <td className="text-base-content/60">{u.email}</td>
                  <td className="font-mono text-base-content/60">{u.phone}</td>
                  <td>
                    <span
                      className={`badge badge-sm badge-outline ${roleBadge[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${statusBadge[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>{u.totalTrips ?? '—'}</td>
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
            Showing {start + 1}–{Math.min(start + perPage, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="join">
            <button
              className="join-item btn btn-xs"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              «
            </button>
            <button className="join-item btn btn-xs btn-disabled">
              Page {page} of {totalPages}
            </button>
            <button
              className="join-item btn btn-xs"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
            >
              »
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
