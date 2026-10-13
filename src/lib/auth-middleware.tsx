import { useSession } from './auth-client'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export function useRequireAuth() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/login', replace: true })
    }
  }, [session, isPending, navigate])

  return { session, isPending, isAuthenticated: !!session }
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isPending } = useRequireAuth()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-base-content/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // useRequireAuth will handle redirect
  }

  return <>{children}</>
}
