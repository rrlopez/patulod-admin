import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { prismaQuery } from '../../lib/prisma-client'

interface BookingSummary {
  id: string
  reference: string
  status: string
}

const CANCELLABLE = new Set(['SEARCHING', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED'])

export function BookingActions({ bookingId }: { bookingId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const { data: booking } = useQuery<BookingSummary>({
    queryKey: ['booking', bookingId, 'info'],
    queryFn: () =>
      prismaQuery<BookingSummary>({
        model: 'booking',
        operation: 'findUnique',
        args: {
          where: { id: bookingId },
          select: { id: true, reference: true, status: true },
        },
      }),
    staleTime: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId] })
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
  }

  const flash = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      Promise.all([
        // Update booking status
        prismaQuery({
          model: 'booking',
          operation: 'update',
          args: {
            where: { id: bookingId },
            data: { status: 'CANCELLED' },
          },
        }),
        // Record cancellation in trip if one exists
        prismaQuery({
          model: 'trip',
          operation: 'updateMany',
          args: {
            where: { bookingId },
            data: {
              cancellationReason: reason,
              cancellationInitiator: 'ADMIN',
            },
          },
        }),
        // Write booking event
        prismaQuery({
          model: 'bookingEvent',
          operation: 'create',
          args: {
            data: {
              bookingId,
              fromStatus: booking?.status ?? null,
              toStatus: 'CANCELLED',
              actorRole: 'ADMIN',
              reason,
            },
          },
        }),
      ]),
    onSuccess: () => {
      invalidate()
      setShowCancelModal(false)
      setCancelReason('')
      flash('Booking cancelled.')
    },
  })

  const isCancellable = booking ? CANCELLABLE.has(booking.status) : false

  return (
    <>
      <div className="space-y-4">
        <div className="card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-3">
            <h2 className="font-bold text-primary mb-3">Actions</h2>

            {actionSuccess && (
              <div className="alert alert-success py-2 text-xs mb-2">{actionSuccess}</div>
            )}
            {cancelMutation.isError && (
              <div className="alert alert-error py-2 text-xs mb-2">Action failed. Please try again.</div>
            )}

            <div className="space-y-2">
              {isCancellable && (
                <button
                  className="btn btn-error btn-sm btn-outline w-full"
                  disabled={cancelMutation.isPending}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Booking
                </button>
              )}

              {!isCancellable && booking && (
                <p className="text-xs text-base-content/50 text-center py-2">
                  No actions available for <strong>{booking.status.replace(/_/g, ' ')}</strong> bookings.
                </p>
              )}

              <button
                className="btn btn-ghost btn-sm w-full border border-base-300"
                onClick={() => navigate({ to: '/bookings' })}
              >
                ← Back to Bookings
              </button>
            </div>
          </div>
        </div>

        {/* Booking meta */}
        {booking && (
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Booking Info</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-base-content/60">Reference</span>
                  <span className="text-xs font-mono font-bold text-primary">{booking.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-base-content/60">Status</span>
                  <span className="text-xs font-medium">{booking.status.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-primary mb-2">Cancel Booking</h3>
            <p className="text-sm text-base-content/60 mb-3">
              Provide a reason for cancelling booking <strong className="font-mono">{booking?.reference}</strong>.
              This will be recorded in the audit trail.
            </p>
            <textarea
              className="textarea textarea-bordered w-full text-sm mb-3"
              rows={3}
              placeholder="e.g. Admin intervention — both parties unreachable…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowCancelModal(false); setCancelReason('') }}
                disabled={cancelMutation.isPending}
              >
                Close
              </button>
              <button
                className="btn btn-error btn-sm"
                disabled={!cancelReason.trim() || cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(cancelReason.trim())}
              >
                {cancelMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Confirm Cancel
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCancelModal(false)} />
        </div>
      )}
    </>
  )
}
