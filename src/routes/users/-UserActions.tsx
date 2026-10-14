import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { prismaQuery } from '../../lib/prisma-client'

interface PatulodUser {
  id: string
  fullName: string
  isActive: boolean
  isSuspended: boolean
}

export function UserActions({ userId }: { userId: string }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [suspendReason, setSuspendReason] = useState('')
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const { data: user } = useQuery<PatulodUser>({
    queryKey: ['user', userId, 'profile'],
    queryFn: () =>
      prismaQuery<PatulodUser>({
        model: 'patulodUser',
        operation: 'findUnique',
        args: {
          where: { id: userId },
          select: { id: true, fullName: true, isActive: true, isSuspended: true },
        },
      }),
    staleTime: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const flash = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const suspendMutation = useMutation({
    mutationFn: (reason: string) =>
      prismaQuery({
        model: 'patulodUser',
        operation: 'update',
        args: {
          where: { id: userId },
          data: { isSuspended: true, suspendedReason: reason },
        },
      }),
    onSuccess: () => {
      invalidate()
      setShowSuspendModal(false)
      setSuspendReason('')
      flash('Account suspended.')
    },
  })

  const reinstateMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'patulodUser',
        operation: 'update',
        args: {
          where: { id: userId },
          data: { isSuspended: false, suspendedReason: null },
        },
      }),
    onSuccess: () => {
      invalidate()
      flash('Account reinstated.')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'patulodUser',
        operation: 'update',
        args: {
          where: { id: userId },
          data: { isActive: false },
        },
      }),
    onSuccess: () => {
      invalidate()
      flash('Account deactivated.')
    },
  })

  const isPending =
    suspendMutation.isPending ||
    reinstateMutation.isPending ||
    deactivateMutation.isPending

  return (
    <>
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-primary mb-2">Quick Actions</h2>

          {actionSuccess && (
            <div className="alert alert-success py-2 text-sm mb-2">
              {actionSuccess}
            </div>
          )}

          {(suspendMutation.isError || reinstateMutation.isError || deactivateMutation.isError) && (
            <div className="alert alert-error py-2 text-sm mb-2">
              Action failed. Please try again.
            </div>
          )}

          <div className="space-y-2">
            {user?.isSuspended ? (
              <button
                className="btn btn-success btn-block btn-sm"
                disabled={isPending}
                onClick={() => reinstateMutation.mutate()}
              >
                {reinstateMutation.isPending && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Reinstate Account
              </button>
            ) : (
              <button
                className="btn btn-warning btn-block btn-sm"
                disabled={isPending}
                onClick={() => setShowSuspendModal(true)}
              >
                Suspend Account
              </button>
            )}

            {user?.isActive && (
              <button
                className="btn btn-error btn-block btn-sm btn-outline"
                disabled={isPending}
                onClick={() => {
                  if (confirm(`Deactivate account for ${user.fullName}? This cannot be undone easily.`)) {
                    deactivateMutation.mutate()
                  }
                }}
              >
                {deactivateMutation.isPending && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Deactivate Account
              </button>
            )}

            <button
              className="btn btn-ghost btn-block btn-sm"
              onClick={() => navigate({ to: '/users' })}
            >
              ← Back to Users
            </button>
          </div>
        </div>
      </div>

      {/* Suspend modal */}
      {showSuspendModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-primary mb-2">Suspend Account</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Provide a reason for suspending <strong>{user?.fullName}</strong>.
              This will be recorded and shown to the user.
            </p>
            <textarea
              className="textarea textarea-bordered w-full mb-4"
              rows={3}
              placeholder="Reason for suspension…"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowSuspendModal(false); setSuspendReason('') }}
                disabled={suspendMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning btn-sm"
                disabled={!suspendReason.trim() || suspendMutation.isPending}
                onClick={() => suspendMutation.mutate(suspendReason.trim())}
              >
                {suspendMutation.isPending && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Confirm Suspend
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowSuspendModal(false)} />
        </div>
      )}
    </>
  )
}
