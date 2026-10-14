import { createFileRoute } from '@tanstack/react-router'
import { useState, useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { BookingsTable, type BookingStatusFilter, type BookingRow } from './-BookingsTable'

export const Route = createFileRoute('/bookings/')({
  component: Bookings,
})

function Bookings() {
  return (
    <ProtectedRoute>
      <BookingsContent />
    </ProtectedRoute>
  )
}

// Raw shape from Prisma — includes nested passenger relation
interface RawBookingRow {
  id: string
  reference: string
  status: string
  fareEstimate: string | number
  serviceType: string
  pickupAddress: string
  destinationAddress: string
  createdAt: string
  passenger: { fullName: string } | null
  trip: { driver: { fullName: string } | null } | null
}

const PER_PAGE = 15

function BookingsContent() {
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const deferredSearch = useDeferredValue(search)

  const where: Record<string, unknown> = {}
  if (statusFilter !== 'ALL') where.status = statusFilter
  if (deferredSearch.trim()) {
    where.reference = { contains: deferredSearch.trim(), mode: 'insensitive' }
  }

  const queryKey = ['bookings', 'list', where, page]

  const { data: rawRows, isLoading } = useQuery<RawBookingRow[]>({
    queryKey,
    queryFn: () =>
      prismaQuery<RawBookingRow[]>({
        model: 'booking',
        operation: 'findMany',
        args: {
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            id: true,
            reference: true,
            status: true,
            fareEstimate: true,
            serviceType: true,
            pickupAddress: true,
            destinationAddress: true,
            createdAt: true,
            passenger: { select: { fullName: true } },
            trip: {
              select: {
                driver: { select: { fullName: true } },
              },
            },
          },
        },
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: total } = useQuery<number>({
    queryKey: ['bookings', 'count', where],
    queryFn: () =>
      prismaQuery<number>({
        model: 'booking',
        operation: 'count',
        args: { where },
      }),
    staleTime: 30_000,
  })

  // Flatten nested relations for the table component
  const rows: BookingRow[] = (rawRows ?? []).map((r) => ({
    ...r,
    passengerName: r.passenger?.fullName,
    driverName: r.trip?.driver?.fullName,
  }))

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Bookings</h1>
        <p className="text-xs text-base-content/60">Manage all trip bookings</p>
      </div>

      {/* Reference search */}
      <div className="mb-3">
        <label className="input input-bordered input-sm flex items-center gap-2 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by reference…"
            className="grow"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </label>
      </div>

      <BookingsTable
        rows={rows}
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
