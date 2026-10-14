import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../lib/auth-client'
import { prismaQuery } from '../../lib/prisma-client'

interface AdminProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 items-start py-3 border-b border-base-300 last:border-0">
      <label className="text-sm font-medium text-base-content/70 pt-2">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

export function ProfileTab() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: profile, isLoading, error: profileError } = useQuery<AdminProfile>({
    queryKey: ['admin', 'profile'],
    queryFn: () =>
      prismaQuery<AdminProfile>({
        model: 'admin',
        operation: 'findFirst',
        args: { where: { userId: session?.user?.id } },
      }),
    enabled: !!session?.user?.id,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName)
      setPhone(profile.phone ?? '')
    }
  }, [profile?.id])

  const updateMutation = useMutation({
    mutationFn: (data: { fullName: string; phone: string }) =>
      prismaQuery({
        model: 'admin',
        operation: 'update',
        args: {
          where: { id: profile?.id },
          data: {
            fullName: data.fullName.trim(),
            phone: data.phone.trim() || null,
          },
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'profile'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ fullName, phone })
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-bold text-primary mb-6">My Profile</h2>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 py-3 border-b border-base-300">
              <div className="h-4 skeleton rounded w-2/3" />
              <div className="col-span-2 h-9 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-primary mb-6">My Profile</h2>

      {profileError && (
        <div className="alert alert-error mb-4 text-sm">
          Failed to load profile. Please refresh.
        </div>
      )}
      {saveSuccess && (
        <div className="alert alert-success mb-4 text-sm">
          Profile updated successfully.
        </div>
      )}
      {updateMutation.isError && (
        <div className="alert alert-error mb-4 text-sm">
          {(updateMutation.error as Error).message}
        </div>
      )}

      {profile && (
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              type="email"
              value={profile.email}
              className="input input-bordered input-sm w-full bg-base-300 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-base-content/40 mt-1">Email cannot be changed here</p>
          </Field>

          <Field label="Role">
            <input
              type="text"
              value={profile.role.replace(/_/g, ' ')}
              className="input input-bordered input-sm w-full bg-base-300 cursor-not-allowed"
              disabled
            />
          </Field>

          <Field label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input input-bordered input-sm w-full"
              required
              minLength={2}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input input-bordered input-sm w-full"
              placeholder="+63 917 123 4567"
            />
          </Field>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <span className="loading loading-spinner loading-xs" />}
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setFullName(profile.fullName); setPhone(profile.phone ?? '') }}
              disabled={updateMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
