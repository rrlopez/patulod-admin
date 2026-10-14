import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import {
  SupportTable,
  type SupportStatusFilter,
  type SupportTypeFilter,
  type SupportCaseRow,
} from './-SupportTable'

export const Route = createFileRoute('/support/')({
  component: SupportCases,
})

function SupportCases() {
  return (
    <ProtectedRoute>
      <SupportCasesContent />
    </ProtectedRoute>
  )
}

interface RawSupportRow {
  id: string
  type: string
  category: string | null
  status: string
  description: string
  createdAt: string
  reporter: { fullName: string } | null
}

const PER_PAGE = 15

function SupportCasesContent() {
  const [statusFilter, setStatusFilter] = useState<SupportStatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<SupportTypeFilter>('ALL')
  const [page, setPage] = useState(1)

  const where: Record<string, unknown> = {}
  if (statusFilter !== 'ALL') where.status = statusFilter
  if (typeFilter !== 'ALL') where.type = typeFilter

  const queryKey = ['support', 'list', where, page]

  const { data: rawRows, isLoading } = useQuery<RawSupportRow[]>({
    queryKey,
    queryFn: () =>
      prismaQuery<RawSupportRow[]>({
        model: 'supportCase',
        operation: 'findMany',
        args: {
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            id: true,
            type: true,
            category: true,
            status: true,
            description: true,
            createdAt: true,
            reporter: { select: { fullName: true } },
          },
        },
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: total } = useQuery<number>({
    queryKey: ['support', 'count', where],
    queryFn: () =>
      prismaQuery<number>({
        model: 'supportCase',
        operation: 'count',
        args: { where },
      }),
    staleTime: 30_000,
  })

  const rows: SupportCaseRow[] = (rawRows ?? []).map((r) => ({
    ...r,
    reporterName: r.reporter?.fullName,
  }))

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Support Cases</h1>
        <p className="text-xs text-base-content/60">Manage customer support requests</p>
      </div>

      <SupportTable
        rows={rows}
        total={total ?? 0}
        page={page}
        perPage={PER_PAGE}
        isLoading={isLoading}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusChange={(s) => { setStatusFilter(s); setPage(1) }}
        onTypeChange={(t) => { setTypeFilter(t); setPage(1) }}
        onPageChange={setPage}
      />
    </Layout>
  )
}
