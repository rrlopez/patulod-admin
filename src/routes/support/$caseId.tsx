import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import Layout from '../../components/Layout'
import { ProtectedRoute } from '../../lib/auth-middleware'
import { prismaQuery } from '../../lib/prisma-client'
import { CaseDetails } from './-CaseDetails'
import { CaseEvents } from './-CaseEvents'
import { CaseActions } from './-CaseActions'

export const Route = createFileRoute('/support/$caseId')({
  component: SupportCaseDetail,
})

function SupportCaseDetail() {
  return (
    <ProtectedRoute>
      <SupportCaseDetailContent />
    </ProtectedRoute>
  )
}

function SupportCaseDetailContent() {
  const { caseId } = Route.useParams()

  // Fetch just header fields — shares cache key with CaseDetails + CaseActions
  const { data: header } = useQuery<{ type: string; status: string }>({
    queryKey: ['support', caseId, 'details'],
    queryFn: () =>
      prismaQuery<{ type: string; status: string }>({
        model: 'supportCase',
        operation: 'findUnique',
        args: {
          where: { id: caseId },
          select: { type: true, status: true },
        },
      }),
    staleTime: 30_000,
  })

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-primary mb-1">Support Case</h1>
        <p className="text-xs text-base-content/60 font-mono">
          {header
            ? `${header.type.replace(/_/g, ' ')} · ${header.status.replace(/_/g, ' ')}`
            : caseId}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <CaseDetails caseId={caseId} />
          <CaseEvents caseId={caseId} />
        </div>
        <div>
          <CaseActions caseId={caseId} />
        </div>
      </div>
    </Layout>
  )
}
