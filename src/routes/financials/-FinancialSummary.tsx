import { useQueries } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface EarningsAggregate {
  _sum: {
    passengerFare: string | number | null
    driverEarnings: string | number | null
    platformCommission: string | number | null
  }
}

function fmt(val: string | number | null | undefined) {
  if (val == null) return '₱0.00'
  return `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SummaryCard({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string
  value: string
  icon: string
  isLoading: boolean
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-base-content/60 mb-1">{title}</p>
            {isLoading
              ? <div className="h-6 w-24 skeleton rounded" />
              : <p className="text-xl font-bold text-primary">{value}</p>}
          </div>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}

export function FinancialSummary() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['financials', 'summary', 'totals'],
        queryFn: () =>
          prismaQuery<EarningsAggregate>({
            model: 'earnings',
            operation: 'aggregate',
            args: {
              _sum: {
                passengerFare: true,
                driverEarnings: true,
                platformCommission: true,
              },
            },
          }),
        staleTime: 60_000,
      },
      {
        queryKey: ['financials', 'summary', 'pending'],
        queryFn: () =>
          prismaQuery<EarningsAggregate>({
            model: 'earnings',
            operation: 'aggregate',
            args: {
              _sum: { driverEarnings: true },
              where: { settledAt: null },
            },
          }),
        staleTime: 60_000,
      },
    ],
  })

  const [totals, pending] = results
  const isLoading = results.some((r) => r.isLoading)

  const cards = [
    {
      title: 'Total Revenue',
      value: fmt(totals.data?._sum?.passengerFare),
      icon: '💰',
    },
    {
      title: 'Platform Commission',
      value: fmt(totals.data?._sum?.platformCommission),
      icon: '📊',
    },
    {
      title: 'Driver Earnings',
      value: fmt(totals.data?._sum?.driverEarnings),
      icon: '🚗',
    },
    {
      title: 'Pending Payouts',
      value: fmt(pending.data?._sum?.driverEarnings),
      icon: '⏳',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((c) => (
        <SummaryCard key={c.title} {...c} isLoading={isLoading} />
      ))}
    </div>
  )
}
