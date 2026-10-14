import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useSession } from '../../lib/auth-client'
import { prismaQuery } from '../../lib/prisma-client'
import { formatDate } from '../../lib/date-format'
import type { DriverApplication } from './-ApplicationInfo'

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'badge-warning',
  IN_PROGRESS:      'badge-info',
  APPROVED:         'badge-success',
  REJECTED:         'badge-error',
  DOCUMENTS_NEEDED: 'badge-info',
  SUSPENDED:        'badge-warning',
  INACTIVE:         'badge-ghost',
}

export function ApplicationActions({ applicationId }: { applicationId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const { data: app } = useQuery<DriverApplication>({
    queryKey: ['driver', applicationId, 'info'],
    queryFn: () =>
      prismaQuery<DriverApplication>({
        model: 'driverApplication',
        operation: 'findUnique',
        args: { where: { id: applicationId } },
      }),
    staleTime: 30_000,
  })

  // Check if all documents are approved
  const { data: documents } = useQuery<Array<{ id: string; reviewStatus: string }>>({
    queryKey: ['driver', applicationId, 'documents'],
    queryFn: () =>
      prismaQuery<Array<{ id: string; reviewStatus: string }>>({
        model: 'driverDocument',
        operation: 'findMany',
        args: {
          where: { driverApplicationId: applicationId },
          select: { id: true, reviewStatus: true },
        },
      }),
    staleTime: 30_000,
  })

  const allDocumentsApproved = documents?.every(doc => doc.reviewStatus === 'APPROVED') ?? false
  const hasDocuments = (documents?.length ?? 0) > 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['driver', applicationId] })
    queryClient.invalidateQueries({ queryKey: ['drivers'] })
  }

  const flash = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const reviewerName = session?.user?.name ?? 'Admin'

  const startReviewMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'driverApplication',
        operation: 'update',
        args: {
          where: { id: applicationId },
          data: { status: 'IN_PROGRESS' },
        },
      }),
    onSuccess: () => { invalidate(); flash('Review started.') },
  })

  const approveMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'driverApplication',
        operation: 'update',
        args: {
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewerName,
            rejectionReason: null,
          },
        },
      }),
    onSuccess: () => { invalidate(); flash('Application approved.') },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) =>
      prismaQuery({
        model: 'driverApplication',
        operation: 'update',
        args: {
          where: { id: applicationId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewerName,
            rejectionReason: reason,
          },
        },
      }),
    onSuccess: () => {
      invalidate()
      setShowRejectModal(false)
      setRejectReason('')
      flash('Application rejected.')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'driverApplication',
        operation: 'update',
        args: {
          where: { id: applicationId },
          data: {
            status: 'SUSPENDED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewerName,
          },
        },
      }),
    onSuccess: () => { invalidate(); flash('Driver suspended.') },
  })

  const reinstateMutation = useMutation({
    mutationFn: () =>
      prismaQuery({
        model: 'driverApplication',
        operation: 'update',
        args: {
          where: { id: applicationId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date().toISOString(),
            reviewedBy: reviewerName,
            rejectionReason: null,
          },
        },
      }),
    onSuccess: () => { invalidate(); flash('Driver reinstated.') },
  })

  const isPending =
    startReviewMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    suspendMutation.isPending ||
    reinstateMutation.isPending

  const hasError =
    startReviewMutation.isError ||
    approveMutation.isError ||
    rejectMutation.isError ||
    suspendMutation.isError ||
    reinstateMutation.isError

  const status = app?.status ?? ''

  return (
    <>
      <div className="space-y-4">
        {/* Actions card */}
        <div className="card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-3">
            <h2 className="font-bold text-primary mb-3">Actions</h2>

            {actionSuccess && (
              <div className="alert alert-success py-2 text-xs mb-2">{actionSuccess}</div>
            )}
            {hasError && (
              <div className="alert alert-error py-2 text-xs mb-2">Action failed. Please try again.</div>
            )}

            <div className="space-y-2">
              {status === 'PENDING' && (
                <>
                  <button
                    className="btn btn-info btn-sm w-full"
                    disabled={isPending}
                    onClick={() => startReviewMutation.mutate()}
                  >
                    {startReviewMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                    ▶ Start Review
                  </button>
                  
                  <div className="alert alert-info py-2 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Click "Start Review" to begin reviewing documents</span>
                  </div>
                </>
              )}

              {status === 'IN_PROGRESS' && (
                <>
                  <button
                    className="btn btn-success btn-sm w-full"
                    disabled={isPending || !allDocumentsApproved}
                    onClick={() => approveMutation.mutate()}
                  >
                    {approveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                    ✓ Approve Application
                  </button>
                  
                  {!hasDocuments && (
                    <div className="alert alert-info py-2 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No documents submitted yet</span>
                    </div>
                  )}
                  
                  <button
                    className="btn btn-error btn-sm btn-outline w-full"
                    disabled={isPending}
                    onClick={() => setShowRejectModal(true)}
                  >
                    ✕ Reject Application
                  </button>
                </>
              )}

              {status === 'APPROVED' && (
                <button
                  className="btn btn-warning btn-sm btn-outline w-full"
                  disabled={isPending}
                  onClick={() => suspendMutation.mutate()}
                >
                  {suspendMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                  ⚠ Suspend Driver
                </button>
              )}

              {status === 'REJECTED' && (
                <button
                  className="btn btn-success btn-sm btn-outline w-full"
                  disabled={isPending}
                  onClick={() => approveMutation.mutate()}
                >
                  {approveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                  ↺ Reconsider & Approve
                </button>
              )}

              {status === 'SUSPENDED' && (
                <button
                  className="btn btn-success btn-sm btn-outline w-full"
                  disabled={isPending}
                  onClick={() => reinstateMutation.mutate()}
                >
                  {reinstateMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                  ✓ Reinstate Driver
                </button>
              )}

              <button
                className="btn btn-ghost btn-sm w-full border border-base-300"
                onClick={() => navigate({ to: '/drivers' })}
              >
                ← Back to Applications
              </button>
            </div>
          </div>
        </div>

        {/* Application meta card */}
        {app && (
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Application Info</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">ID</span>
                  <span className="text-xs font-mono font-bold text-primary truncate max-w-32">{app.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Status</span>
                  <span className={`badge badge-sm ${STATUS_BADGE[app.status] ?? 'badge-ghost'}`}>
                    {app.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Submitted</span>
                  <span className="text-xs">
                    {formatDate(app.submittedAt)}
                  </span>
                </div>
                {app.reviewedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-base-content/60">Reviewed</span>
                    <span className="text-xs">
                      {formatDate(app.reviewedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document review summary */}
        {hasDocuments && (
          <div className="card bg-base-200 border border-base-300 shadow-sm">
            <div className="card-body p-3">
              <h2 className="font-bold text-primary mb-3">Document Review</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Total Documents</span>
                  <span className="text-xs font-bold">{documents?.length ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Approved</span>
                  <span className="text-xs font-bold text-success">
                    {documents?.filter(d => d.reviewStatus === 'APPROVED').length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Pending</span>
                  <span className="text-xs font-bold text-warning">
                    {documents?.filter(d => d.reviewStatus === 'PENDING').length ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-base-content/60">Rejected</span>
                  <span className="text-xs font-bold text-error">
                    {documents?.filter(d => d.reviewStatus === 'REJECTED').length ?? 0}
                  </span>
                </div>
                {allDocumentsApproved && (
                  <div className="alert alert-success py-2 text-xs mt-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>All documents approved!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg text-primary mb-2">Reject Application</h3>
            <p className="text-sm text-base-content/60 mb-3">
              Provide a reason for rejecting <strong>{app?.fullName}</strong>'s application.
              This will be visible to the applicant.
            </p>
            <textarea
              className="textarea textarea-bordered w-full text-sm mb-3"
              rows={3}
              placeholder="e.g. Vehicle registration document is expired…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="modal-action">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowRejectModal(false); setRejectReason('') }}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(rejectReason.trim())}
              >
                {rejectMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Reject Application
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowRejectModal(false)} />
        </div>
      )}
    </>
  )
}
