import { useQueries } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface EarningsAggregate {
  _sum: { passengerFare: string | number | null }
}

interface BookingAggregate {
  _avg: { fareEstimate: string | number | null }
}

function MiniCard({
  icon,
  value,
  label,
  accent,
  isLoading,
}: {
  icon: string
  value: string | number
  label: string
  accent: string
  isLoading: boolean
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center shrink-0`}>
            <span className="text-lg">{icon}</span>
          </div>
          <div className="min-w-0">
            {isLoading ? (
              <div className="h-6 w-20 skeleton rounded mb-1" />
            ) : (
              <p className="text-xl font-bold text-primary">{value}</p>
            )}
            <p className="text-xs text-base-content/60">{label}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SecondaryMetrics() {
  // Start of today (midnight local time) as ISO string
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const results = useQueries({
    queries: [
      // Trips completed today
      {
        queryKey: ['dashboard', 'completedToday'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'booking',
            operation: 'count',
            args: {
              where: {
                status: 'COMPLETED',
                updatedAt: { gte: todayStart.toISOString() },
              },
            },
          }),
        staleTime: 30_000,
      },
      // Revenue this week — sum of passengerFare from Earnings
      {
        queryKey: ['dashboard', 'weeklyRevenue'],
        queryFn: () =>
          prismaQuery<EarningsAggregate>({
            model: 'earnings',
            operation: 'aggregate',
            args: {
              _sum: { passengerFare: true },
              where: {
                createdAt: {
                  gte: (() => {
                    const d = new Date()
                    d.setDate(d.getDate() - 7)
                    return d.toISOString()
                  })(),
                },
              },
            },
          }),
        staleTime: 60_000,
      },
      // Average fare estimate across all bookings (proxy for avg trip value)
      {
        queryKey: ['dashboard', 'avgFare'],
        queryFn: () =>
          prismaQuery<BookingAggregate>({
            model: 'booking',
            operation: 'aggregate',
            args: {
              _avg: { fareEstimate: true },
              where: { status: 'COMPLETED' },
            },
          }),
        staleTime: 60_000,
      },
    ],
  })

  const [completedToday, weeklyRevenue, avgFare] = results
  const loading = results.some((r) => r.isLoading)

  const revenueSum = weeklyRevenue.data?._sum?.passengerFare
  const revenueFormatted = revenueSum != null
    ? `₱${Number(revenueSum).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '₱0.00'

  const avgFareVal = avgFare.data?._avg?.fareEstimate
  const avgFareFormatted = avgFareVal != null
    ? `₱${Number(avgFareVal).toFixed(2)}`
    : '₱0.00'

  const cards = [
    {
      icon: '✅',
      value: completedToday.data ?? 0,
      label: 'Trips Completed Today',
      accent: 'bg-primary/10',
    },
    {
      icon: '💰',
      value: revenueFormatted,
      label: 'Revenue This Week',
      accent: 'bg-secondary/20',
    },
    {
      icon: '🧾',
      value: avgFareFormatted,
      label: 'Avg Completed Fare',
      accent: 'bg-primary/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {cards.map((c) => (
        <MiniCard key={c.label} {...c} isLoading={loading} />
      ))}
    </div>
  )
}
