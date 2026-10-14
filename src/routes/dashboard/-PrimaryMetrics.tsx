import { useQueries } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
  isLoading,
}: {
  title: string
  value: string | number
  sub: string
  icon: string
  accent: string
  isLoading: boolean
}) {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-3">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs text-base-content/60 mb-1">{title}</p>
            {isLoading ? (
              <div className="h-8 w-16 skeleton rounded" />
            ) : (
              <p className="text-2xl font-bold text-base-content">{value}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg ${accent} flex items-center justify-center`}>
            <span className="text-xl">{icon}</span>
          </div>
        </div>
        <p className="text-xs text-base-content/50">{sub}</p>
      </div>
    </div>
  )
}

export function PrimaryMetrics() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'totalUsers'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'patulodUser',
            operation: 'count',
            args: {},
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ['dashboard', 'activeDrivers'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'driverAvailability',
            operation: 'count',
            args: { where: { isOnline: true } },
          }),
        staleTime: 15_000,
      },
      {
        queryKey: ['dashboard', 'totalDrivers'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'driverAvailability',
            operation: 'count',
            args: {},
          }),
        staleTime: 30_000,
      },
      {
        queryKey: ['dashboard', 'activeBookings'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'booking',
            operation: 'count',
            args: {
              where: {
                status: { in: ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] },
              },
            },
          }),
        staleTime: 15_000,
      },
      {
        queryKey: ['dashboard', 'openCases'],
        queryFn: () =>
          prismaQuery<number>({
            model: 'supportCase',
            operation: 'count',
            args: { where: { status: { in: ['RECEIVED', 'UNDER_REVIEW'] } } },
          }),
        staleTime: 30_000,
      },
    ],
  })

  const [totalUsers, activeDrivers, totalDrivers, activeBookings, openCases] = results
  const loading = results.some((r) => r.isLoading)

  const cards = [
    {
      title: 'Total Users',
      value: totalUsers.data ?? 0,
      sub: 'Registered accounts',
      icon: '👥',
      accent: 'bg-primary/10',
    },
    {
      title: 'Active Drivers',
      value: loading ? '—' : `${activeDrivers.data ?? 0}/${totalDrivers.data ?? 0}`,
      sub: 'Online right now',
      icon: '🚗',
      accent: 'bg-secondary/20',
    },
    {
      title: 'Active Bookings',
      value: activeBookings.data ?? 0,
      sub: 'In progress or pending',
      icon: '📋',
      accent: 'bg-primary/10',
    },
    {
      title: 'Open Support Cases',
      value: openCases.data ?? 0,
      sub: 'Requires attention',
      icon: '💬',
      accent: 'bg-warning/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {cards.map((c) => (
        <StatCard key={c.title} {...c} isLoading={loading} />
      ))}
    </div>
  )
}
