import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useSession } from '../lib/auth-client'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session, isPending } = useSession()

  // Show loading while checking auth status
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

  // Redirect based on auth status
  if (session) {
    // User is logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }

  // User is not logged in, redirect to login
  return <Navigate to="/login" replace />
}
