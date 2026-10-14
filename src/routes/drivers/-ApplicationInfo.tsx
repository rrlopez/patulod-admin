import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'
import { formatDate } from '../../lib/date-format'

export interface DriverApplication {
  id: string
  fullName: string
  email: string
  phone: string
  vehicleType: string
  plateNumber: string
  vehicleModel: string
  vehicleColor: string
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  rejectionReason: string | null
  notes: string | null
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-base-content/50 uppercase mb-0.5">{label}</p>
      <div className="text-xs font-medium text-base-content">{children}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-3 space-y-3">
        <div className="h-4 skeleton rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-3 skeleton rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ApplicationInfo({ applicationId }: { applicationId: string }) {
  const { data: app, isLoading, isError } = useQuery<DriverApplication>({
    queryKey: ['driver', applicationId, 'info'],
    queryFn: () =>
      prismaQuery<DriverApplication>({
        model: 'driverApplication',
        operation: 'findUnique',
        args: { where: { id: applicationId } },
      }),
    staleTime: 30_000,
  })

  if (isLoading) return <><SkeletonCard /><SkeletonCard /></>

  if (isError || !app) {
    return <div className="alert alert-error"><span>Failed to load application.</span></div>
  }

  return (
    <div className="space-y-4">
      {/* Personal */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-3">
          <h2 className="font-bold text-primary mb-3">Personal Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name">{app.fullName}</Field>
            <Field label="Phone"><span className="font-mono">{app.phone}</span></Field>
            <Field label="Email">{app.email}</Field>
            <Field label="Submitted">
              {formatDate(app.submittedAt, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Field>
            {app.reviewedAt && (
              <>
                <Field label="Reviewed On">
                  {formatDate(app.reviewedAt)}
                </Field>
                <Field label="Reviewed By">{app.reviewedBy ?? '—'}</Field>
              </>
            )}
          </div>
          {app.rejectionReason && (
            <div className="mt-3 pt-3 border-t border-base-300">
              <p className="text-xs font-semibold text-base-content/50 uppercase mb-1">Rejection Reason</p>
              <div className="alert alert-error text-xs py-2">{app.rejectionReason}</div>
            </div>
          )}
          {app.notes && (
            <div className="mt-3 pt-3 border-t border-base-300">
              <p className="text-xs font-semibold text-base-content/50 uppercase mb-1">Admin Notes</p>
              <p className="text-xs text-base-content/70">{app.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-3">
          <h2 className="font-bold text-primary mb-3">Vehicle Information</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <span className={`badge badge-sm ${app.vehicleType === 'tricycle' ? 'badge-primary' : 'badge-secondary'}`}>
                {app.vehicleType.toUpperCase()}
              </span>
            </Field>
            <Field label="Plate Number">
              <span className="font-mono font-bold">{app.plateNumber}</span>
            </Field>
            <Field label="Model">{app.vehicleModel}</Field>
            <Field label="Color">{app.vehicleColor}</Field>
          </div>
        </div>
      </div>
    </div>
  )
}
