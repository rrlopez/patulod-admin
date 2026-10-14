import { createFileRoute } from '@tanstack/react-router'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { UserProfile } from './-UserProfile'
import { UserTrips } from './-UserTrips'
import { UserActions } from './-UserActions'

export const Route = createFileRoute('/users/$userId')({
  component: UserDetail,
})

function UserDetail() {
  return (
    <ProtectedRoute>
      <UserDetailContent />
    </ProtectedRoute>
  )
}

function UserDetailContent() {
  const { userId } = Route.useParams()

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">User Details</h1>
        <p className="text-xs text-base-content/60">ID: {userId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <UserProfile userId={userId} />
          <UserTrips userId={userId} />
        </div>
        <div>
          <UserActions userId={userId} />
        </div>
      </div>
    </Layout>
  )
}
