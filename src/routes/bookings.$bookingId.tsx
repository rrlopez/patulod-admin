import { createFileRoute, useNavigate } from '@tanstack/react-router'
import Layout from '../components/Layout'
import { mockBookings, mockBookingEvents } from '../mock/bookings'

export const Route = createFileRoute('/bookings/$bookingId')({
  component: BookingDetail,
})

function BookingDetail() {
  const { bookingId } = Route.useParams()
  const navigate = useNavigate()
  const booking = mockBookings.find((b) => b.id === bookingId)
  const events = mockBookingEvents.filter((e) => e.bookingId === bookingId)

  if (!booking) {
    return (
      <Layout>
        <div className="alert alert-error">
          <span>Booking not found</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-4">
        <button
          className="btn btn-ghost btn-sm mb-2"
          onClick={() => navigate({ to: '/bookings' })}
        >
          ← Back to Bookings
        </button>
        <h1 className="text-2xl font-bold text-primary mb-1">Booking Details</h1>
        <p className="text-xs text-base-content/60 font-mono">{booking.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary">Trip Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-xs text-base-content/60 mb-1">Status</p>
                  <span
                    className={`badge ${
                      booking.status === 'COMPLETED'
                        ? 'badge-success'
                        : booking.status === 'CANCELLED'
                          ? 'badge-error'
                          : 'badge-warning'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Rider</p>
                  <p className="font-medium">{booking.riderName}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Driver</p>
                  <p className="font-medium">{booking.driverName || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-base-content/60 mb-1">Pickup</p>
                  <p className="font-medium">{booking.pickupAddress}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-base-content/60 mb-1">Dropoff</p>
                  <p className="font-medium">{booking.dropoffAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Fare</p>
                  <p className="font-medium text-lg">₱{booking.fare}</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Distance</p>
                  <p className="font-medium">{booking.distance} km</p>
                </div>
                <div>
                  <p className="text-xs text-base-content/60 mb-1">Created At</p>
                  <p className="font-medium">{booking.createdAt}</p>
                </div>
                {booking.completedAt && (
                  <div>
                    <p className="text-xs text-base-content/60 mb-1">Completed At</p>
                    <p className="font-medium">{booking.completedAt}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary">Trip Timeline</h2>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-px h-full bg-base-300" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium text-sm">{event.type}</p>
                      <p className="text-xs text-base-content/60">
                        {event.description}
                      </p>
                      <p className="text-xs text-base-content/40 mt-1">
                        {event.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="btn btn-primary btn-block btn-sm">
                  Contact Rider
                </button>
                <button className="btn btn-secondary btn-block btn-sm">
                  Contact Driver
                </button>
                <button className="btn btn-warning btn-block btn-sm">
                  Issue Refund
                </button>
                <button className="btn btn-error btn-block btn-sm">
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
