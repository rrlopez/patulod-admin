import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface EarningsRow {
  id: string
  tripId: string
  passengerFare: string | number
  driverEarnings: string | number
  platformCommission: string | number
  adjustmentAmount: string | number
  settledAt: string | null
  createdAt: string
  driver: { fullName: string } | null
}

const STATUS_BADGE = (settledAt: string | null) =>
  settledAt ? 'badge-success' : 'badge-warning'

const STATUS_LABEL = (settledAt: string | null) =>
  settledAt ? 'SETTLED' : 'PENDING'

function fmt(val: string | number) {
  return `₱${Number(val).toFixed(2)}`
}

const PER_PAGE = 15

export function EarningsTable() {
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const where: Record<string, unknown> = {}
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom).toISOString() } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`).toISOString() } : {}),
    }
  }

  const queryKey = ['financials', 'earnings', where, page]

  const { data: rows, isLoading } = useQuery<EarningsRow[]>({
    queryKey,
    queryFn: () =>
      prismaQuery<EarningsRow[]>({
        model: 'earnings',
        operation: 'findMany',
        args: {
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
          select: {
            id: true,
            tripId: true,
            passengerFare: true,
            driverEarnings: true,
            platformCommission: true,
            adjustmentAmount: true,
            settledAt: true,
            createdAt: true,
            driver: { select: { fullName: true } },
          },
        },
      }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })

  const { data: total } = useQuery<number>({
    queryKey: ['financials', 'earnings', 'count', where],
    queryFn: () =>
      prismaQuery<number>({
        model: 'earnings',
        operation: 'count',
        args: { where },
      }),
    staleTime: 30_000,
  })

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / PER_PAGE))
  const start = (page - 1) * PER_PAGE

  const handleDateChange = (field: 'from' | 'to', val: string) => {
    field === 'from' ? setDateFrom(val) : setDateTo(val)
    setPage(1)
  }

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
      {/* Date filter */}
      <div className="card-body p-3 border-b border-base-300">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs text-base-content/50">Filter by date:</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-base-content/60">From</label>
            <input
              type="date"
              className="input input-bordered input-xs"
              value={dateFrom}
              onChange={(e) => handleDateChange('from', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-base-content/60">To</label>
            <input
              type="date"
              className="input input-bordered input-xs"
              value={dateTo}
              onChange={(e) => handleDateChange('to', e.target.value)}
            />
          </div>
          {(dateFrom || dateTo) && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-xs">
          <thead className="bg-base-300 text-primary">
            <tr>
              <th>Driver</th>
              <th>Trip ID</th>
              <th>Passenger Fare</th>
              <th>Commission</th>
              <th>Driver Earnings</th>
              <th>Adjustment</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: PER_PAGE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><div className="h-3 skeleton rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              : (rows ?? []).length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-base-content/40">
                      No earnings records found.
                    </td>
                  </tr>
                )
                : (rows ?? []).map((e) => (
                    <tr key={e.id} className="hover:bg-base-100 transition-colors">
                      <td className="font-medium">{e.driver?.fullName ?? '—'}</td>
                      <td className="font-mono text-xs">{e.tripId}</td>
                      <td>{fmt(e.passengerFare)}</td>
                      <td className="text-error/80">{fmt(e.platformCommission)}</td>
                      <td className="font-medium text-success">{fmt(e.driverEarnings)}</td>
                      <td>
                        {Number(e.adjustmentAmount) !== 0
                          ? <span className={Number(e.adjustmentAmount) > 0 ? 'text-success' : 'text-error'}>
                              {Number(e.adjustmentAmount) > 0 ? '+' : ''}{fmt(e.adjustmentAmount)}
                            </span>
                          : <span className="text-base-content/40">—</span>}
                      </td>
                      <td className="text-base-content/60">
                        {new Date(e.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${STATUS_BADGE(e.settledAt)}`}>
                          {STATUS_LABEL(e.settledAt)}
                        </span>
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
            : `Showing ${(total ?? 0) === 0 ? 0 : start + 1}–${Math.min(start + PER_PAGE, total ?? 0)} of ${total ?? 0}`}
        </span>
        <div className="join">
          <button className="join-item btn btn-xs" onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}>«</button>
          <button className="join-item btn btn-xs btn-disabled">Page {page} of {totalPages}</button>
          <button className="join-item btn btn-xs" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages || isLoading}>»</button>
        </div>
      </div>
    </div>
  )
}
