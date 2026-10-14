import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

export interface SupportCase {
  id: string
  type: string
  category: string | null
  status: string
  description: string
  bookingId: string | null
  createdAt: string
  updatedAt: string
  reporter: { id: string; fullName: string; phone: string; role: string } | null
  assignedStaff: { id: string; fullName: string } | null
}

const TYPE_BADGE: Record<string, string> = {
  DISPUTE:         'badge-error',
  REPORT:          'badge-warning',
  LOST_BELONGINGS: 'badge-info',
  INCIDENT:        'badge-error',
}

const STATUS_BADGE: Record<string, string> = {
  RECEIVED:     'badge-warning',
  UNDER_REVIEW: 'badge-info',
  ACTION_TAKEN: 'badge-primary',
  CLOSED:       'badge-ghost',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-base-content/60 mb-0.5">{label}</p>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

export function CaseDetails({ caseId }: { caseId: string }) {
  const { data: sc, isLoading, isError } = useQuery<SupportCase>({
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

  if (isLoading) {
    return (
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body space-y-3">
          <div className="h-4 skeleton rounded w-1/4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-3 skeleton rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !sc) {
    return <div className="alert alert-error"><span>Failed to load case details.</span></div>
  }

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between mb-3">
          <h2 className="card-title text-primary">Case Details</h2>
          <div className="flex gap-2">
            <span className={`badge badge-sm ${TYPE_BADGE[sc.type] ?? 'badge-ghost'}`}>
              {sc.type.replace(/_/g, ' ')}
            </span>
            <span className={`badge badge-sm ${STATUS_BADGE[sc.status] ?? 'badge-ghost'}`}>
              {sc.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Reporter">
            {sc.reporter
              ? <span>{sc.reporter.fullName} <span className="text-base-content/50 font-mono text-xs">({sc.reporter.phone})</span></span>
              : '—'}
          </Field>

          <Field label="Reporter Role">
            {sc.reporter
              ? <span className={`badge badge-sm ${sc.reporter.role === 'DRIVER' ? 'badge-secondary' : 'badge-primary'}`}>{sc.reporter.role}</span>
              : '—'}
          </Field>

          <Field label="Category">
            {sc.category
              ? <span className="badge badge-sm badge-outline">{sc.category}</span>
              : <span className="text-base-content/40">Not specified</span>}
          </Field>

          <Field label="Assigned To">
            {sc.assignedStaff?.fullName ?? <span className="text-base-content/40">Unassigned</span>}
          </Field>

          {sc.bookingId && (
            <Field label="Related Booking">
              <span className="font-mono text-xs">{sc.bookingId}</span>
            </Field>
          )}

          <Field label="Opened">
            {new Date(sc.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </Field>
        </div>

        <div className="mt-4 pt-3 border-t border-base-300">
          <p className="text-xs text-base-content/60 mb-1">Description</p>
          <p className="text-sm leading-relaxed">{sc.description}</p>
        </div>
      </div>
    </div>
  )
}
