import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockUsers } from '../mock/users'
import { mockBookings } from '../mock/bookings'

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
  const navigate = useNavigate()
  const user = mockUsers.find((u) => u.id === userId)

  if (!user) {
    return (
      <Layout>
        <div className="alert alert-error">
          <span>User not found</span>
        </div>
      </Layout>
    )
  }

  const userBookings = mockBookings.filter((b) => b.riderId === userId)

  return (
    <Layout>
      <div className="mb-4">
        <button className="btn btn-ghost btn-sm mb-2" onClick={() => navigate({ to: '/users' })}>
          ← Back to Users
        </button>
        <h1 className="text-2xl font-bold text-primary mb-1">User Details</h1>
        <p className="text-xs text-base-content/60">ID: {user.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary">Profile Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Phone</p>
                  <p className="font-medium font-mono">{user.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Role</p>
                  <span className="badge badge-primary">{user.role}</span>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Status</p>
                  <span
                    className={`badge ${
                      user.status === 'ACTIVE'
                        ? 'badge-success'
                        : user.status === 'SUSPENDED'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Joined</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 shadow-sm mt-4">
            <div className="card-body">
              <h2 className="card-title text-primary">Recent Trips</h2>
              <div className="space-y-2">
                {userBookings.length > 0 ? (
                  userBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-base-100 rounded-lg border border-base-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm font-medium">{b.id}</span>
                        <span
                          className={`badge badge-sm ${
                            b.status === 'COMPLETED'
                              ? 'badge-success'
                              : b.status === 'CANCELLED'
                                ? 'badge-error'
                                : 'badge-warning'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-base-content/60">
                        {b.pickupAddress} → {b.dropoffAddress}
                      </p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-base-content/60">
                          {b.createdAt}
                        </span>
                        <span className="font-medium">₱{b.fare}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-base-content/60 py-4">
                    No trips found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="btn btn-primary btn-block btn-sm">
                  Send Message
                </button>
                <button className="btn btn-warning btn-block btn-sm">
                  Suspend Account
                </button>
                <button className="btn btn-error btn-block btn-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
