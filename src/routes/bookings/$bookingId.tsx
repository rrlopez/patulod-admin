import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { BookingInfo } from './-BookingInfo'
import { BookingTimeline } from './-BookingTimeline'
import { BookingActions } from './-BookingActions'

export const Route = createFileRoute('/bookings/$bookingId')({
  component: BookingDetail,
})

function BookingDetail() {
  return (
    <ProtectedRoute>
      <BookingDetailContent />
    </ProtectedRoute>
  )
}

function BookingDetailContent() {
  const { bookingId } = Route.useParams()

  // Fetch just the header fields — shares cache with BookingInfo/BookingActions
  const { data: header } = useQuery<{ reference: string; status: string }>({
    queryKey: ['booking', bookingId, 'info'],
    queryFn: () =>
      prismaQuery<{ reference: string; status: string }>({
        model: 'booking',
        operation: 'findUnique',
        args: {
          where: { id: bookingId },
          select: { reference: true, status: true },
        },
      }),
    staleTime: 30_000,
  })

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Booking Details</h1>
        <p className="text-xs text-base-content/60 font-mono">
          {header?.reference ?? bookingId}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <BookingInfo bookingId={bookingId} />
          <BookingTimeline bookingId={bookingId} />
        </div>
        <div>
          <BookingActions bookingId={bookingId} />
        </div>
      </div>
    </Layout>
  )
}
