import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { DriversTable, type DriverStatusFilter, type ApplicationRow } from './-DriversTable'

export const Route = createFileRoute('/drivers/')({
  component: DriverApplications,
})

function DriverApplications() {
  return (
    <ProtectedRoute>
      <DriverApplicationsContent />
    </ProtectedRoute>
  )
}

const PER_PAGE = 15

function DriverApplicationsContent() {
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>('ALL')
  const [page, setPage] = useState(1)

  const where: Record<string, unknown> = {}
  if (statusFilter !== 'ALL') where.status = statusFilter

  const queryKey = ['drivers', 'list', where, page]

  const { data: rows, isLoading } = useQuery<ApplicationRow[]>({
    queryKey,
    queryFn: () =>
      prismaQuery<ApplicationRow[]>({
        model: 'driverApplication',
        operation: 'findMany',
        args: {
          where,
          orderBy: { submittedAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            vehicleType: true,
            plateNumber: true,
            status: true,
            submittedAt: true,
          },
        },
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: total } = useQuery<number>({
    queryKey: ['drivers', 'count', where],
    queryFn: () =>
      prismaQuery<number>({
        model: 'driverApplication',
        operation: 'count',
        args: { where },
      }),
    staleTime: 30_000,
  })

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Driver Applications</h1>
        <p className="text-xs text-base-content/60">
          Review and manage driver applications
        </p>
      </div>

      <DriversTable
        rows={rows ?? []}
        total={total ?? 0}
        page={page}
        perPage={PER_PAGE}
        isLoading={isLoading}
        statusFilter={statusFilter}
        onStatusChange={(s) => { setStatusFilter(s); setPage(1) }}
        onPageChange={setPage}
      />
    </Layout>
  )
}
