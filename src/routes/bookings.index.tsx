import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import Layout from '../components/Layout'
import { ProtectedRoute } from '../lib/auth-middleware'
import { mockBookings, type BookingStatus } from '../mock/bookings'

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

function BookingsContent() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'ALL'>('ALL')

  const filtered = mockBookings.filter(
    (b) => statusFilter === 'ALL' || b.status === statusFilter
  )

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'badge-success'
      case 'CANCELLED':
        return 'badge-error'
      case 'IN_PROGRESS':
        return 'badge-info'
      default:
        return 'badge-warning'
    }
  }

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Bookings</h1>
        <p className="text-xs text-base-content/60">Manage all trip bookings</p>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="flex gap-2 flex-wrap">
            {(
              [
                'ALL',
                'SEARCHING',
                'DRIVER_ASSIGNED',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED',
              ] as const
            ).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn btn-xs ${
                  statusFilter === s ? 'btn-primary' : 'btn-ghost border border-base-300'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead className="bg-base-300 text-primary">
              <tr>
                <th>Booking ID</th>
                <th>Rider</th>
                <th>Driver</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>Status</th>
                <th>Fare</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-base-100 transition-colors">
                  <td className="font-mono font-medium">{b.id}</td>
                  <td>{b.riderName}</td>
                  <td>{b.driverName || '—'}</td>
                  <td className="text-base-content/60 max-w-xs truncate">
                    {b.pickupAddress}
                  </td>
                  <td className="text-base-content/60 max-w-xs truncate">
                    {b.dropoffAddress}
                  </td>
                  <td>
                    <span className={`badge badge-sm ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="font-medium">₱{b.fare}</td>
                  <td className="text-base-content/60">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-primary btn-outline"
                      onClick={() => navigate({ to: `/bookings/${b.id}` })}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
