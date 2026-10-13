import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockBookings } from '../mock/bookings'
import { mockDriverProfiles } from '../mock/drivers'
import { mockSupportCases } from '../mock/support'
import { mockUsers } from '../mock/users'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const navigate = useNavigate()

  const totalUsers = mockUsers.length
  const activeDrivers = mockDriverProfiles.filter((d) => d.isOnline).length
  const totalDrivers = mockDriverProfiles.length
  const activeBookings = mockBookings.filter((b) =>
    ['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(
      b.status
    )
  ).length
  const completedToday = mockBookings.filter(
    (b) =>
      b.status === 'COMPLETED' &&
      new Date(b.completedAt || '').toDateString() === new Date().toDateString()
  ).length
  const openCases = mockSupportCases.filter(
    (c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS'
  ).length

  const recentActivity = [
    {
      id: 1,
      icon: '📋',
      message: 'New booking from Sofia Mendoza',
      time: '2 minutes ago',
    },
    {
      id: 2,
      icon: '🚗',
      message: 'Pedro Gonzales went online',
      time: '8 minutes ago',
    },
    {
      id: 3,
      icon: '💬',
      message: 'New support case: Payment dispute',
      time: '15 minutes ago',
    },
    {
      id: 4,
      icon: '✅',
      message: 'Trip PTL-2026100901 completed',
      time: '23 minutes ago',
    },
    {
      id: 5,
      icon: '📄',
      message: 'New driver application from Carlos Bautista',
      time: '45 minutes ago',
    },
  ]

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Dashboard</h1>
        <p className="text-sm text-base-content/60">
          Welcome back! Here's what's happening with PATULOD today.
        </p>
      </div>

      {/* Primary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          {
            title: 'Total Users',
            value: totalUsers,
            sub: 'Registered accounts',
            icon: '👥',
            accent: 'bg-primary/10',
          },
          {
            title: 'Active Drivers',
            value: `${activeDrivers}/${totalDrivers}`,
            sub: 'Online right now',
            icon: '🚗',
            accent: 'bg-secondary/20',
          },
          {
            title: 'Active Bookings',
            value: activeBookings,
            sub: 'In progress or pending',
            icon: '📋',
            accent: 'bg-primary/10',
          },
          {
            title: 'Open Support Cases',
            value: openCases,
            sub: 'Requires attention',
            icon: '💬',
            accent: 'bg-warning/10',
          },
        ].map((m) => (
          <div
            key={m.title}
            className="card bg-base-200 border border-base-300 shadow-sm"
          >
            <div className="card-body p-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">{m.title}</p>
                  <p className="text-2xl font-bold text-base-content">{m.value}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg ${m.accent} flex items-center justify-center`}
                >
                  <span className="text-xl">{m.icon}</span>
                </div>
              </div>
              <p className="text-xs text-base-content/50">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[
          {
            icon: '✅',
            value: completedToday,
            label: 'Trips Completed Today',
            accent: 'bg-primary/10',
          },
          {
            icon: '💰',
            value: '₱8,934',
            label: 'Revenue This Week',
            accent: 'bg-secondary/20',
          },
          {
            icon: '⭐',
            value: '4.7',
            label: 'Average Rating',
            accent: 'bg-primary/10',
          },
        ].map((m) => (
          <div
            key={m.label}
            className="card bg-base-200 border border-base-300 shadow-sm"
          >
            <div className="card-body p-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg ${m.accent} flex items-center justify-center`}
                >
                  <span className="text-lg">{m.icon}</span>
                </div>
                <div>
                  <p className="text-xl font-bold text-primary">{m.value}</p>
                  <p className="text-xs text-base-content/60">{m.label}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-primary">Recent Activity</h2>
              <button className="btn btn-ghost btn-xs text-primary">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 p-2 rounded-lg bg-base-100"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-base">{a.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-base-content">
                      {a.message}
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <h2 className="font-bold text-primary mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
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
                  sub: '2 pending',
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
                  sub: `${openCases} open`,
                  path: '/support',
                  cls: 'bg-warning/10 hover:bg-warning/20 border border-warning/20',
                },
              ].map((q) => (
                <button
                  key={q.path}
                  onClick={() => navigate({ to: q.path })}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors ${q.cls}`}
                >
                  <span className="text-lg">{q.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-primary">{q.label}</p>
                    <p className="text-xs text-base-content/50">{q.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
