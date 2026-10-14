import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

export function QuickActions() {
  const navigate = useNavigate()

  // Pull open case count so the badge stays live
  const { data: openCases } = useQuery<number>({
    queryKey: ['dashboard', 'openCases'],
    queryFn: () =>
      prismaQuery<number>({
        model: 'supportCase',
        operation: 'count',
        args: { where: { status: { in: ['RECEIVED', 'UNDER_REVIEW'] } } },
      }),
    staleTime: 30_000,
  })

  // Pull pending driver applications count
  const { data: pendingApps } = useQuery<number>({
    queryKey: ['dashboard', 'pendingApps'],
    queryFn: () =>
      prismaQuery<number>({
        model: 'driverApplication',
        operation: 'count',
        args: { where: { status: 'PENDING' } },
      }),
    staleTime: 30_000,
  })

  const actions = [
    {
      icon: '👤',
      label: 'View Users',
      sub: 'Manage accounts',
      path: '/users',
      cls: 'bg-primary/10 hover:bg-primary/20 border border-primary/20',
    },
    {
      icon: '📄',
      label: 'Review Applications',
      sub: pendingApps != null ? `${pendingApps} pending` : 'Driver applications',
      path: '/drivers',
      cls: 'bg-secondary/10 hover:bg-secondary/20 border border-secondary/20',
    },
    {
      icon: '📋',
      label: 'View Bookings',
      sub: 'Monitor trips',
      path: '/bookings',
      cls: 'bg-primary/10 hover:bg-primary/20 border border-primary/20',
    },
    {
      icon: '💬',
      label: 'Support Cases',
      sub: openCases != null ? `${openCases} open` : 'View cases',
      path: '/support',
      cls: 'bg-warning/10 hover:bg-warning/20 border border-warning/20',
    },
  ]

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm h-full">
      <div className="card-body p-4">
        <h2 className="font-bold text-primary mb-3">Quick Actions</h2>
        <div className="space-y-2">
          {actions.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate({ to: a.path })}
              className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors ${a.cls}`}
            >
              <span className="text-lg">{a.icon}</span>
              <div>
                <p className="text-xs font-semibold text-primary">{a.label}</p>
                <p className="text-xs text-base-content/50">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
