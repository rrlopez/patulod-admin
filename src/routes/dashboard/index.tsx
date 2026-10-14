import { createFileRoute } from '@tanstack/react-router'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { PrimaryMetrics } from './-PrimaryMetrics'
import { SecondaryMetrics } from './-SecondaryMetrics'
import { RecentActivity } from './-RecentActivity'
import { QuickActions } from './-QuickActions'

export const Route = createFileRoute('/dashboard/')({
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
  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Dashboard</h1>
        <p className="text-sm text-base-content/60">
          Welcome back! Here's what's happening with PATULOD today.
        </p>
      </div>

      <PrimaryMetrics />
      <SecondaryMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </Layout>
  )
}
