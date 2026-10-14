import { createFileRoute } from '@tanstack/react-router'
import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { UserFilters, type UserRoleFilter } from './-UserFilters'
import { UsersTable, type UserRow } from './-UsersTable'

export const Route = createFileRoute('/users/')({
  component: Users,
})

function Users() {
  return (
    <ProtectedRoute>
      <UsersContent />
    </ProtectedRoute>
  )
}

const PER_PAGE = 10

function UsersContent() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL')
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState<keyof UserRow>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Defer search so keystrokes don't spam the server
  const deferredSearch = useDeferredValue(search)

  // Build Prisma where clause from filters
  const where: Record<string, unknown> = {}
  if (deferredSearch.trim()) {
    where.OR = [
      { fullName: { contains: deferredSearch.trim(), mode: 'insensitive' } },
      { phone: { contains: deferredSearch.trim() } },
    ]
  }
  if (roleFilter !== 'ALL') {
    where.role = roleFilter
  }

  const queryKey = ['users', 'list', where, sortField, sortDir, page]

  // Fetch paginated rows
  const { data: rows, isLoading } = useQuery<UserRow[]>({
    queryKey,
    queryFn: () =>
      prismaQuery<UserRow[]>({
        model: 'patulodUser',
        operation: 'findMany',
        args: {
          where,
          orderBy: { [sortField]: sortDir },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            id: true,
            fullName: true,
            phone: true,
            role: true,
            isActive: true,
            isSuspended: true,
            createdAt: true,
            userId: true,
          },
        },
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  // Fetch total count separately for pagination
  const { data: total } = useQuery<number>({
    queryKey: ['users', 'count', where],
    queryFn: () =>
      prismaQuery<number>({
        model: 'patulodUser',
        operation: 'count',
        args: { where },
      }),
    staleTime: 30_000,
  })

  const handleSort = (field: keyof UserRow) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Users & Accounts</h1>
        <p className="text-xs text-base-content/60">
          Manage passenger and driver accounts
        </p>
      </div>

      <UserFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        roleFilter={roleFilter}
        onRoleChange={(r) => { setRoleFilter(r); setPage(1) }}
      />

      <UsersTable
        rows={rows ?? []}
        total={total ?? 0}
        page={page}
        perPage={PER_PAGE}
        isLoading={isLoading}
        onPageChange={setPage}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </Layout>
  )
}
