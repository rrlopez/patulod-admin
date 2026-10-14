import { useQueries } from '@tanstack/react-query'
import { prismaQuery } from '../../lib/prisma-client'

interface PatulodUser {
  id: string
  fullName: string
  phone: string
  role: string
  isActive: boolean
  isSuspended: boolean
  suspendedReason: string | null
  termsAcceptedAt: string | null
  privacyAcknowledgedAt: string | null
  createdAt: string
  userId: string // Better Auth user.id
}

interface AuthUser {
  id: string
  email: string
  name: string
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-base-content/60 mb-1">{label}</p>
      <div className="font-medium">{children}</div>
    </div>
  )
}

export function UserProfile({ userId }: { userId: string }) {
  const [patulodQuery, authQuery] = useQueries({
    queries: [
      {
        queryKey: ['user', userId, 'profile'],
        queryFn: () =>
          prismaQuery<PatulodUser>({
            model: 'patulodUser',
            operation: 'findUnique',
            args: { where: { id: userId } },
          }),
        staleTime: 30_000,
      },
      // We fetch the auth user separately to get email
      // (resolved after patulodUser loads to get the userId FK)
      {
        queryKey: ['user', userId, 'authUser'],
        queryFn: async () => {
          const pu = await prismaQuery<PatulodUser>({
            model: 'patulodUser',
            operation: 'findUnique',
            args: { where: { id: userId }, select: { userId: true } },
          })
          if (!pu?.userId) return null
          return prismaQuery<AuthUser>({
            model: 'user',
            operation: 'findUnique',
            args: { where: { id: pu.userId }, select: { id: true, email: true, name: true } },
          })
        },
        staleTime: 60_000,
      },
    ],
  })

  const user = patulodQuery.data
  const authUser = authQuery.data
  const isLoading = patulodQuery.isLoading

  if (isLoading) {
    return (
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body space-y-3">
          <div className="h-5 skeleton rounded w-1/3" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 skeleton rounded w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="alert alert-error">
        <span>User not found.</span>
      </div>
    )
  }

  const statusLabel = user.isSuspended ? 'SUSPENDED' : user.isActive ? 'ACTIVE' : 'INACTIVE'
  const statusCls = user.isSuspended
    ? 'badge-warning'
    : user.isActive
      ? 'badge-success'
      : 'badge-error'

  return (
    <div className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body">
        <h2 className="card-title text-primary">Profile Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name">{user.fullName}</Field>

          <Field label="Email">
            {authUser?.email ?? <span className="text-base-content/40">—</span>}
          </Field>

          <Field label="Phone">
            <span className="font-mono">{user.phone}</span>
          </Field>

          <Field label="Role">
            <span
              className={`badge ${user.role === 'DRIVER' ? 'badge-secondary' : 'badge-primary'}`}
            >
              {user.role}
            </span>
          </Field>

          <Field label="Status">
            <span className={`badge ${statusCls}`}>{statusLabel}</span>
          </Field>

          <Field label="Joined">
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Field>

          {user.isSuspended && user.suspendedReason && (
            <div className="col-span-2">
              <Field label="Suspension Reason">
                <span className="text-warning">{user.suspendedReason}</span>
              </Field>
            </div>
          )}

          <Field label="Terms Accepted">
            {user.termsAcceptedAt
              ? new Date(user.termsAcceptedAt).toLocaleDateString()
              : <span className="text-base-content/40">Not accepted</span>}
          </Field>

          <Field label="Privacy Acknowledged">
            {user.privacyAcknowledgedAt
              ? new Date(user.privacyAcknowledgedAt).toLocaleDateString()
              : <span className="text-base-content/40">Not acknowledged</span>}
          </Field>
        </div>
      </div>
    </div>
  )
}
