import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { ApplicationInfo, type DriverApplication } from './-ApplicationInfo'
import { ApplicationDocuments } from './-ApplicationDocuments'
import { ApplicationActions } from './-ApplicationActions'

export const Route = createFileRoute('/drivers/$applicationId')({
  component: DriverApplicationDetail,
})

const STATUS_BADGE: Record<string, string> = {
  PENDING:          'badge-warning',
  APPROVED:         'badge-success',
  REJECTED:         'badge-error',
  DOCUMENTS_NEEDED: 'badge-info',
  SUSPENDED:        'badge-warning',
  INACTIVE:         'badge-ghost',
}

function DriverApplicationDetail() {
  return (
    <ProtectedRoute>
      <DriverApplicationDetailContent />
    </ProtectedRoute>
  )
}

function DriverApplicationDetailContent() {
  const { applicationId } = Route.useParams()

  // Fetch just the header fields so we can render the page title immediately
  const { data: app } = useQuery<Pick<DriverApplication, 'fullName' | 'email' | 'status'>>({
    queryKey: ['driver', applicationId, 'info'],
    queryFn: () =>
      prismaQuery<DriverApplication>({
        model: 'driverApplication',
        operation: 'findUnique',
        args: { where: { id: applicationId } },
      }),
    staleTime: 30_000,
    select: (d) => ({ fullName: d.fullName, email: d.email, status: d.status }),
  })

  return (
    <Layout>
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-0.5">
              {app?.fullName ?? '—'}
            </h1>
            <p className="text-xs text-base-content/60">{app?.email ?? applicationId}</p>
          </div>
          {app?.status && (
            <span className={`badge ${STATUS_BADGE[app.status] ?? 'badge-ghost'}`}>
              {app.status.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <ApplicationInfo applicationId={applicationId} />
          <ApplicationDocuments applicationId={applicationId} />
        </div>
        <div>
          <ApplicationActions applicationId={applicationId} />
        </div>
      </div>
    </Layout>
  )
}
