import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useSession } from '../../lib/auth-client'
import { prismaQuery } from '../../lib/prisma-client'
import { useState } from 'react'
import type { SupportCase } from './-CaseDetails'

const STATUS_BADGE: Record<string, string> = {
  RECEIVED:     'badge-warning',
  UNDER_REVIEW: 'badge-info',
  ACTION_TAKEN: 'badge-primary',
  CLOSED:       'badge-ghost',
}

export function CaseActions({ caseId }: { caseId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const { data: sc } = useQuery<SupportCase>({
    queryKey: ['support', caseId, 'details'],
    queryFn: () =>
      prismaQuery<SupportCase>({
        model: 'supportCase',
        operation: 'findUnique',
        args: {
          where: { id: caseId },
          include: {
            reporter: { select: { id: true, fullName: true, phone: true, role: true } },
            assignedStaff: { select: { id: true, fullName: true } },
          },
        },
      }),
    staleTime: 30_000,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['support', caseId] })
    queryClient.invalidateQueries({ queryKey: ['support', 'list'] })
  }

  const flash = (msg: string) => {
    setActionSuccess(msg)
    setTimeout(() => setActionSuccess(null), 3000)
  }

  const actorId = session?.user?.id ?? null

  const writeEvent = (action: string, note?: string) =>
    prismaQuery({
      model: 'supportCaseEvent',
      operation: 'create',
      args: { data: { caseId, actorId, action, note: note ?? null } },
    })

  const updateStatus = (status: string, action: string, note?: string) =>
    Promise.all([
      prismaQuery({
        model: 'supportCase',
        operation: 'update',
        args: { where: { id: caseId }, data: { status } },
      }),
      writeEvent(action, note),
    ])

  const assignMutation = useMutation({
    mutationFn: () =>
      Promise.all([
        prismaQuery({
          model: 'supportCase',
          operation: 'update',
          args: {
            where: { id: caseId },
            data: {
              assignedStaffId: sc?.reporter?.id ?? null, // placeholder — assign to reporter's patulodUser
              status: sc?.status === 'RECEIVED' ? 'UNDER_REVIEW' : sc?.status,
            },
          },
        }),
        writeEvent('ASSIGNED', `Assigned by ${session?.user?.name ?? 'Admin'}`),
      ]),
    onSuccess: () => { invalidate(); flash('Case assigned to you.') },
  })

  const resolveMutation = useMutation({
    mutationFn: () => updateStatus('ACTION_TAKEN', 'RESOLVED', 'Case marked as resolved.'),
    onSuccess: () => { invalidate(); flash('Case marked as resolved.') },
  })

  const closeMutation = useMutation({
    mutationFn: () => updateStatus('CLOSED', 'CLOSED', 'Case closed.'),
    onSuccess: () => { invalidate(); flash('Case closed.') },
  })

  const reopenMutation = useMutation({
    mutationFn: () => updateStatus('UNDER_REVIEW', 'REOPENED', 'Case reopened for review.'),
    onSuccess: () => { invalidate(); flash('Case reopened.') },
  })

  const isPending =
    assignMutation.isPending ||
    resolveMutation.isPending ||
    closeMutation.isPending ||
    reopenMutation.isPending

  const hasError =
    assignMutation.isError ||
    resolveMutation.isError ||
    closeMutation.isError ||
    reopenMutation.isError

  const status = sc?.status ?? ''

  return (
    <div className="space-y-4">
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
            {status !== 'CLOSED' && (
              <button
                className="btn btn-primary btn-sm w-full"
                disabled={isPending}
                onClick={() => assignMutation.mutate()}
              >
                {assignMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Assign to Me
              </button>
            )}

            {(status === 'RECEIVED' || status === 'UNDER_REVIEW') && (
              <button
                className="btn btn-success btn-sm w-full"
                disabled={isPending}
                onClick={() => resolveMutation.mutate()}
              >
                {resolveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Mark Resolved
              </button>
            )}

            {status !== 'CLOSED' && (
              <button
                className="btn btn-ghost btn-sm w-full border border-base-300"
                disabled={isPending}
                onClick={() => closeMutation.mutate()}
              >
                {closeMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Close Case
              </button>
            )}

            {status === 'CLOSED' && (
              <button
                className="btn btn-warning btn-sm btn-outline w-full"
                disabled={isPending}
                onClick={() => reopenMutation.mutate()}
              >
                {reopenMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                Reopen Case
              </button>
            )}

            <button
              className="btn btn-ghost btn-sm w-full"
              onClick={() => navigate({ to: '/support' })}
            >
              ← Back to Cases
            </button>
          </div>
        </div>
      </div>

      {/* Case meta */}
      {sc && (
        <div className="card bg-base-200 border border-base-300 shadow-sm">
          <div className="card-body p-3">
            <h2 className="font-bold text-primary mb-3">Case Info</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Status</span>
                <span className={`badge badge-sm ${STATUS_BADGE[sc.status] ?? 'badge-ghost'}`}>
                  {sc.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Type</span>
                <span className="text-xs font-medium">{sc.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Assigned</span>
                <span className="text-xs">{sc.assignedStaff?.fullName ?? 'Unassigned'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-base-content/60">Opened</span>
                <span className="text-xs">
                  {new Date(sc.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
