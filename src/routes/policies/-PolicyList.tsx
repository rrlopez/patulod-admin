import { useQuery } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

export interface PolicyItem {
  id: string
  type: string
  version: string
  isActive: boolean
  updatedAt: string
}

const TYPE_LABEL: Record<string, string> = {
  TERMS:   'Terms of Service',
  PRIVACY: 'Privacy Policy',
  SAFETY:  'Safety Guidelines',
}

interface PolicyListProps {
  selectedId: string | null
  onSelect: (policy: PolicyItem) => void
}

export function PolicyList({ selectedId, onSelect }: PolicyListProps) {
  const { data: policies, isLoading, isError } = useQuery<PolicyItem[]>({
    queryKey: ['policies', 'list'],
    queryFn: () =>
      prismaQuery<PolicyItem[]>({
        model: 'policyContent',
        operation: 'findMany',
        args: {
          orderBy: { type: 'asc' },
          select: {
            id: true,
            type: true,
            version: true,
            isActive: true,
            updatedAt: true,
          },
        },
      }),
    staleTime: 60_000,
  })

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-3">
        <h2 className="font-bold text-primary mb-2">Policies</h2>

        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 skeleton rounded-lg" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-xs text-error/70">Failed to load policies.</p>
        )}

        {!isLoading && policies?.length === 0 && (
          <p className="text-xs text-base-content/50 text-center py-3">
            No policies yet.
          </p>
        )}

        {!isLoading && policies && policies.length > 0 && (
          <div className="space-y-1">
            {policies.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`btn btn-sm w-full justify-start gap-2 ${
                  selectedId === p.id ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate text-xs font-medium">
                    {TYPE_LABEL[p.type] ?? p.type}
                  </p>
                  <p className="text-xs opacity-60">v{p.version}</p>
                </div>
                {p.isActive && (
                  <span className="badge badge-xs badge-success shrink-0">Active</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
